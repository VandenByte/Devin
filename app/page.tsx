"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, Category } from "@/lib/types";
import { summarizeByCategory, totalSpend } from "@/lib/summary";
import { formatCurrency, formatDate } from "@/lib/format";

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
}

export default function Home() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch {
      setError("No se pudieron cargar las transacciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al procesar el PDF.");
      } else if (data.inserted === 0) {
        setMessage(data.message ?? "No se detectaron transacciones.");
      } else {
        setMessage(`Se importaron ${data.inserted} transacciones.`);
        await loadTransactions();
      }
    } catch {
      setError("Error al subir el archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateCategory = async (id: string, category: Category) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category } : tx))
    );
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  };

  const summary = useMemo(
    () => summarizeByCategory(transactions),
    [transactions]
  );
  const total = useMemo(() => totalSpend(transactions), [transactions]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Mis gastos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Importá el PDF del resumen de tu tarjeta y categorizá tus gastos
          automáticamente.
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-dashed border-gray-300 p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id="pdf-input"
        />
        <label
          htmlFor="pdf-input"
          className="inline-block cursor-pointer rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {uploading ? "Procesando…" : "Subir resumen (PDF)"}
        </label>
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {transactions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Resumen por categoría</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <div
                key={item.category}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {item.category}
                </div>
                <div className="mt-1 font-semibold">
                  {formatCurrency(item.total)}
                </div>
                <div className="text-xs text-gray-400">
                  {item.count} mov.
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right text-sm">
            <span className="text-gray-500">Total: </span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Transacciones</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay transacciones. Subí un resumen para empezar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Descripción</th>
                  <th className="py-2 pr-2">Categoría</th>
                  <th className="py-2 pr-2 text-right">Monto</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-2 pr-2">{tx.description}</td>
                    <td className="py-2 pr-2">
                      <select
                        value={tx.category}
                        onChange={(e) =>
                          updateCategory(tx.id, e.target.value as Category)
                        }
                        className="rounded border border-gray-300 bg-white px-2 py-1"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-right whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-xs text-red-500 hover:underline"
                        aria-label="Eliminar"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
