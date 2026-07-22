import { describe, it, expect } from "vitest";
import { summarizeByCategory, totalSpend } from "@/lib/summary";
import { ParsedTransaction } from "@/lib/types";

const txns: ParsedTransaction[] = [
  { date: "2024-03-01", description: "COTO", amount: 1000, category: "Supermercado" },
  { date: "2024-03-02", description: "JUMBO", amount: 500, category: "Supermercado" },
  { date: "2024-03-03", description: "NETFLIX", amount: 2000, category: "Servicios" },
  { date: "2024-03-04", description: "UBER", amount: 300, category: "Transporte" },
];

describe("summarizeByCategory", () => {
  it("returns an empty array for no transactions", () => {
    expect(summarizeByCategory([])).toEqual([]);
  });

  it("aggregates totals and counts per category", () => {
    const summary = summarizeByCategory(txns);
    const supermercado = summary.find((s) => s.category === "Supermercado");
    expect(supermercado).toEqual({
      category: "Supermercado",
      total: 1500,
      count: 2,
    });
  });

  it("sorts categories by total spend descending", () => {
    const summary = summarizeByCategory(txns);
    expect(summary.map((s) => s.category)).toEqual([
      "Servicios",
      "Supermercado",
      "Transporte",
    ]);
  });
});

describe("totalSpend", () => {
  it("is zero for no transactions", () => {
    expect(totalSpend([])).toBe(0);
  });

  it("sums all amounts", () => {
    expect(totalSpend(txns)).toBe(3800);
  });
});
