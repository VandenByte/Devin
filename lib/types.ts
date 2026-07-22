export type Category =
  | "Supermercado"
  | "Restaurantes"
  | "Transporte"
  | "Combustible"
  | "Servicios"
  | "Salud"
  | "Entretenimiento"
  | "Ropa"
  | "Tecnología"
  | "Viajes"
  | "Educación"
  | "Hogar"
  | "Otros";

export const CATEGORIES: Category[] = [
  "Supermercado",
  "Restaurantes",
  "Transporte",
  "Combustible",
  "Servicios",
  "Salud",
  "Entretenimiento",
  "Ropa",
  "Tecnología",
  "Viajes",
  "Educación",
  "Hogar",
  "Otros",
];

export interface ParsedTransaction {
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Raw merchant / description text as read from the statement. */
  description: string;
  /** Amount in the statement currency. Positive for charges. */
  amount: number;
  /** Detected category from the description. */
  category: Category;
}
