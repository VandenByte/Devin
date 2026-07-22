import { categorize } from "./categorizer";
import { ParsedTransaction } from "./types";

/**
 * Parses a monetary amount written in either the Latin American / European
 * format ("1.234,56") or the US / English format ("1,234.56"), with an
 * optional currency symbol and sign. Returns NaN when the value cannot be
 * interpreted as a number.
 */
export function parseAmount(raw: string): number {
  if (!raw) return NaN;

  let s = raw.trim();
  let sign = 1;

  // Leading/trailing sign or parentheses for negatives.
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-") || s.endsWith("-")) {
    sign = -1;
  }

  // Strip everything except digits and separators.
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return NaN;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  let normalized: string;
  if (lastComma !== -1 && lastDot !== -1) {
    // The right-most separator is the decimal separator.
    if (lastComma > lastDot) {
      // "1.234,56" -> dot is thousands, comma is decimal.
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      // "1,234.56" -> comma is thousands, dot is decimal.
      normalized = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Only commas present. Treat as decimal if it looks like "123,45",
    // otherwise as a thousands separator ("1,234").
    const decimals = s.length - lastComma - 1;
    normalized = decimals === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else {
    // Only dots (or none). Treat "1.234" (3 trailing digits) as thousands.
    const decimals = lastDot !== -1 ? s.length - lastDot - 1 : 0;
    normalized = lastDot !== -1 && decimals === 3 ? s.replace(/\./g, "") : s;
  }

  const value = Number(normalized);
  return Number.isNaN(value) ? NaN : sign * value;
}

const DATE_RE = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
// A monetary amount at end of line: optional sign/currency, digit groups, and a
// mandatory 2-digit decimal part. Requiring decimals avoids picking up stray
// reference numbers (e.g. a branch code like "SUC 045").
const AMOUNT_RE = /[-(]?\$?\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}-?\)?\s*$/;

/**
 * Converts a matched date into an ISO YYYY-MM-DD string. Assumes day-first
 * ordering (DD/MM/YYYY), which is standard for LATAM card statements.
 */
function toIsoDate(day: string, month: string, year: string): string {
  let y = year;
  if (y.length === 2) {
    y = Number(y) > 70 ? `19${y}` : `20${y}`;
  }
  const dd = day.padStart(2, "0");
  const mm = month.padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/**
 * Extracts transactions from the raw text of a credit card statement.
 *
 * The heuristic looks for lines that start with a date and end with a monetary
 * amount, treating the text in between as the merchant description. Lines that
 * don't match this shape (headers, totals, page numbers) are ignored.
 */
export function parseTransactions(text: string): ParsedTransaction[] {
  if (!text) return [];

  const transactions: ParsedTransaction[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(DATE_RE);
    if (!dateMatch || dateMatch.index !== 0) continue;

    const amountMatch = trimmed.match(AMOUNT_RE);
    if (!amountMatch) continue;

    const amount = parseAmount(amountMatch[0]);
    if (Number.isNaN(amount) || amount === 0) continue;

    const description = trimmed
      .slice(dateMatch[0].length, trimmed.length - amountMatch[0].length)
      .replace(/\s+/g, " ")
      .trim();

    if (!description) continue;

    const date = toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]);

    transactions.push({
      date,
      description,
      amount,
      category: categorize(description),
    });
  }

  return transactions;
}
