import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts raw text from a PDF buffer. Kept as a thin wrapper so the
 * text-processing logic (parsing, categorization) can be unit-tested without
 * depending on real PDF files.
 *
 * Uses unpdf (a serverless-friendly pdf.js build) which works inside Next.js
 * route handlers without extra bundler configuration.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}
