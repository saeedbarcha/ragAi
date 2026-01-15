
import fs from "fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { v4 as uuidv4 } from "uuid";
import { vectorStore } from "./vectorstore.js";
import path from 'path'
// Text chunking utility
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

// Extract text from PDF
async function extractTextFromPdf(input) {
  let data;
  
  // Handle both file path (string) and buffer input
  if (typeof input === 'string') {
    const buf = await fs.readFile(input);
    data = new Uint8Array(buf);
  } else if (Buffer.isBuffer(input)) {
    // Convert Buffer to Uint8Array
    data = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (input instanceof Uint8Array) {
    data = input;
  } else {
    throw new Error('Input must be a file path (string) or a Buffer/Uint8Array');
  }

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

// Process file with buffer or file path
async function processFile({ fileBuffer, filePath, originalName, mimeType }) {
  try {
    let text = '';
    const documentId = uuidv4();
    
    // If filePath is provided, read the file
    if (filePath && !fileBuffer) {
      fileBuffer = await fs.readFile(filePath);
    }

    // Process based on file type
    if (mimeType === 'application/pdf') {
      text = await extractTextFromPdf(fileBuffer);
    } else if (mimeType.startsWith('text/')) {
      text = fileBuffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    // Split text into chunks
    const textChunks = chunkText(text);
    
    // Prepare documents for vector store
    const documents = textChunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        documentId,
        chunkIndex: index,
        source: originalName || 'unknown',
        type: mimeType
      }
    }));

    // Add to vector store
    if (!vectorStore || !vectorStore.addDocuments) {
      throw new Error('Vector store is not properly initialized');
    }
    
    try {
      await vectorStore.addDocuments(documents);
      
      return { 
        success: true,
        documentId, 
        chunksProcessed: documents.length
      };
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw new Error(`Failed to store document in vector database: ${error.message}`);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

// Process uploaded file (Express route handler)
async function handleFileUpload(req, res) {
  try {
    console.log('File upload request received. Files:', req.files ? Object.keys(req.files) : 'none');
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    if (req.file) {
      console.log('Request file:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'none'
      });
    } else {
      console.log('No file in request');
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded",
        receivedFields: Object.keys(req.body || {}),
        files: req.files ? Object.keys(req.files) : 'none'
      });
    }
    
    let result;
    try {
      result = await processFile({
        fileBuffer: req.file.buffer,
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
    } catch (processError) {
      console.error('Error in processFile:', processError);
      throw processError;
    }
    
    // Clean up the uploaded file after processing if it was saved to disk
    if (req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    // Return success response with consistent format
    return {
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed
    };
    
  } catch (error) {
    console.error("File processing error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || "Failed to process file" 
      });
    }
    throw error; // Re-throw to be handled by the route handler
  }
}

// Export functions
export { processFile };

// Export handleFileUpload as default
export default handleFileUpload;
