import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf";
import { parseTransactions } from "@/lib/parser";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Se requiere un archivo PDF en el campo 'file'." },
      { status: 400 }
    );
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "El archivo debe ser un PDF." },
      { status: 400 }
    );
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractPdfText(buffer);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el PDF." },
      { status: 422 }
    );
  }

  const parsed = parseTransactions(text);

  if (parsed.length === 0) {
    return NextResponse.json(
      {
        inserted: 0,
        transactions: [],
        message:
          "No se detectaron transacciones en el PDF. Puede que el formato del resumen no sea compatible.",
      },
      { status: 200 }
    );
  }

  await prisma.transaction.createMany({
    data: parsed.map((tx) => ({
      date: new Date(tx.date),
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
    })),
  });

  return NextResponse.json(
    { inserted: parsed.length, transactions: parsed },
    { status: 201 }
  );
}
