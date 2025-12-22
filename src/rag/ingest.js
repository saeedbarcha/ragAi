import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { upsertChunks } from "./pineconeVectorstore.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

function chunkText(text, chunkSize = 1200, overlap = 200) {
  const clean = String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const step = chunkSize - overlap;
  if (step <= 0) throw new Error("chunkSize must be greater than overlap");

  const chunks = [];
  let i = 0;

  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    const chunk = clean.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    i += step;
  }

  return chunks;
}

async function extractTextFromPdf(filePath) {
  const buf = await fs.readFile(filePath);
  const data = new Uint8Array(buf);

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}


export async function extractTextFromUpload({ filePath, mimeType }) {
  const isPdf =
    mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return await extractTextFromPdf(filePath);
  }

  return await fs.readFile(filePath, "utf-8");
}

export async function ingestText({
  text,
  docName = "text",
  documentId = uuidv4(),
}) {
  const chunks = chunkText(text);
  if (!chunks.length) return { documentId, upserted: 0 };

  const { upserted } = await upsertChunks({
    documentId,
    docName,
    chunks,
  });

  return { documentId, upserted };
}

export async function ingestFile({ filePath, originalName, mimeType }) {
  const text = await extractTextFromUpload({ filePath, mimeType });
  return ingestText({ text, docName: originalName });
}
