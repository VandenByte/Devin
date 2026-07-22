import { describe, it, expect } from "vitest";
import { categorize, normalize } from "@/lib/categorizer";

describe("normalize", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalize("  COTO   Sucursal  10 ")).toBe("coto sucursal 10");
  });

  it("returns an empty string for empty input", () => {
    expect(normalize("   ")).toBe("");
  });
});

describe("categorize", () => {
  it("returns 'Otros' for empty descriptions", () => {
    expect(categorize("")).toBe("Otros");
    expect(categorize("   ")).toBe("Otros");
  });

  it("returns 'Otros' when nothing matches", () => {
    expect(categorize("Pago desconocido XYZ 123")).toBe("Otros");
  });

  it("detects supermarkets", () => {
    expect(categorize("COTO CICSA SUC 045")).toBe("Supermercado");
    expect(categorize("Carrefour Express")).toBe("Supermercado");
    expect(categorize("JUMBO PALERMO")).toBe("Supermercado");
  });

  it("detects fuel stations", () => {
    expect(categorize("YPF FULL RUTA 8")).toBe("Combustible");
    expect(categorize("SHELL C.A.P.S.A.")).toBe("Combustible");
  });

  it("detects restaurants and delivery", () => {
    expect(categorize("MCDONALDS ARCOS")).toBe("Restaurantes");
    expect(categorize("PEDIDOSYA")).toBe("Restaurantes");
    expect(categorize("Starbucks Coffee")).toBe("Restaurantes");
  });

  it("detects transport", () => {
    expect(categorize("UBER TRIP")).toBe("Transporte");
    expect(categorize("SUBE CARGA")).toBe("Transporte");
  });

  it("detects subscription services", () => {
    expect(categorize("NETFLIX.COM")).toBe("Servicios");
    expect(categorize("Spotify AB")).toBe("Servicios");
    expect(categorize("EDENOR SA")).toBe("Servicios");
  });

  it("detects health", () => {
    expect(categorize("FARMACITY 123")).toBe("Salud");
    expect(categorize("OSDE CUOTA")).toBe("Salud");
  });

  it("detects technology and marketplaces", () => {
    expect(categorize("MERCADOLIBRE*COMPRA")).toBe("Tecnología");
    expect(categorize("Apple.com/bill")).toBe("Tecnología");
  });

  it("is case-insensitive", () => {
    expect(categorize("netflix")).toBe(categorize("NETFLIX"));
  });

  it("prefers more specific rules listed earlier (fuel over generic)", () => {
    // "estacion" is a fuel keyword and should win for gas stations.
    expect(categorize("ESTACION DE SERVICIO AXION")).toBe("Combustible");
  });
});
