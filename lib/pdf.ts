import { PDFParse } from "pdf-parse";

/**
 * Extracts raw text from a PDF buffer. Kept as a thin wrapper so the
 * text-processing logic (parsing, categorization) can be unit-tested without
 * depending on real PDF files.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
