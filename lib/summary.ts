import { Category, ParsedTransaction } from "./types";

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
}

/**
 * Aggregates transactions by category, returning one entry per category that
 * has at least one transaction, sorted by total spend (descending).
 */
export function summarizeByCategory(
  transactions: ParsedTransaction[]
): CategorySummary[] {
  const totals = new Map<Category, CategorySummary>();

  for (const tx of transactions) {
    const existing = totals.get(tx.category);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      totals.set(tx.category, {
        category: tx.category,
        total: tx.amount,
        count: 1,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

/** Sum of all transaction amounts. */
export function totalSpend(transactions: ParsedTransaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}
