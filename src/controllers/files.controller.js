import { ingestFile } from "../rag/ingest.js";

export async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await ingestFile({
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message || "Upload failed" });
  }
}
