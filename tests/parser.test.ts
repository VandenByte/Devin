import { describe, it, expect } from "vitest";
import { parseAmount, parseTransactions } from "@/lib/parser";

describe("parseAmount", () => {
  it("parses LATAM/European format (dot thousands, comma decimals)", () => {
    expect(parseAmount("1.234,56")).toBeCloseTo(1234.56);
    expect(parseAmount("12.345.678,90")).toBeCloseTo(12345678.9);
    expect(parseAmount("$ 999,99")).toBeCloseTo(999.99);
  });

  it("parses US format (comma thousands, dot decimals)", () => {
    expect(parseAmount("1,234.56")).toBeCloseTo(1234.56);
    expect(parseAmount("$1,000,000.00")).toBeCloseTo(1000000);
  });

  it("parses plain integers and decimals", () => {
    expect(parseAmount("1500")).toBe(1500);
    expect(parseAmount("1500.75")).toBeCloseTo(1500.75);
  });

  it("treats a lone dot with 3 trailing digits as a thousands separator", () => {
    expect(parseAmount("1.234")).toBe(1234);
  });

  it("treats a lone comma with 2 trailing digits as a decimal separator", () => {
    expect(parseAmount("50,25")).toBeCloseTo(50.25);
  });

  it("handles negative amounts (sign and parentheses)", () => {
    expect(parseAmount("-1.234,56")).toBeCloseTo(-1234.56);
    expect(parseAmount("1.234,56-")).toBeCloseTo(-1234.56);
    expect(parseAmount("(1.234,56)")).toBeCloseTo(-1234.56);
  });

  it("returns NaN for non-numeric input", () => {
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
  });
});

describe("parseTransactions", () => {
  it("returns an empty array for empty text", () => {
    expect(parseTransactions("")).toEqual([]);
  });

  it("extracts date, description, amount and category from statement lines", () => {
    const text = [
      "RESUMEN DE CUENTA - VISA",
      "Fecha       Descripción                 Importe",
      "15/03/2024  COTO CICSA SUC 045       $ 12.345,67",
      "16/03/2024  NETFLIX.COM                 1.999,00",
      "17/03/2024  YPF FULL RUTA 8          $ 8.500,00",
      "TOTAL                                  22.844,67",
    ].join("\n");

    const result = parseTransactions(text);
    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      date: "2024-03-15",
      description: "COTO CICSA SUC 045",
      amount: 12345.67,
      category: "Supermercado",
    });
    expect(result[1].category).toBe("Servicios");
    expect(result[2]).toMatchObject({
      date: "2024-03-17",
      category: "Combustible",
      amount: 8500,
    });
  });

  it("ignores lines that do not start with a date", () => {
    const text = [
      "Saldo anterior            10.000,00",
      "Pagos y créditos          -5.000,00",
    ].join("\n");
    expect(parseTransactions(text)).toEqual([]);
  });

  it("supports dashes as date separators and 2-digit years", () => {
    const text = "05-01-24 SPOTIFY AB 599,00";
    const result = parseTransactions(text);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2024-01-05");
    expect(result[0].category).toBe("Servicios");
  });

  it("skips lines without a detectable amount", () => {
    const text = "15/03/2024  COTO CICSA SUC 045";
    expect(parseTransactions(text)).toEqual([]);
  });

  it("skips zero-amount lines", () => {
    const text = "15/03/2024  AJUSTE               0,00";
    expect(parseTransactions(text)).toEqual([]);
  });
});
