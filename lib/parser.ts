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

// A transaction: a date, a description, and a monetary amount with a mandatory
// 2-digit decimal part. Matched globally over the whole text (not line by line)
// so it also works with PDF extractors that collapse everything onto one line.
// Requiring decimals on the amount avoids picking up stray reference numbers
// (e.g. a branch code like "SUC 045").
const TX_RE =
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s+(.+?)\s+([-(]?\$?\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\)?-?)(?=\s|$)/g;

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
 * Scans the whole text for the pattern `<date> <description> <amount>`, treating
 * the text between the date and the amount as the merchant description. Fragments
 * that don't match this shape (headers, totals, page numbers) are ignored.
 */
export function parseTransactions(text: string): ParsedTransaction[] {
  if (!text) return [];

  const transactions: ParsedTransaction[] = [];
  TX_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TX_RE.exec(text)) !== null) {
    const [, day, month, year, rawDescription, rawAmount] = match;

    const amount = parseAmount(rawAmount);
    if (Number.isNaN(amount) || amount === 0) continue;

    const description = rawDescription.replace(/\s+/g, " ").trim();
    if (!description) continue;

    const date = toIsoDate(day, month, year);

    transactions.push({
      date,
      description,
      amount,
      category: categorize(description),
    });
  }

  return transactions;
}
