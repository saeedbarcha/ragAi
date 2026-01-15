import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import uploadFile from "../rag/fileProcessor.js";
import { askRag } from "../rag/ragChain.js";
import { processFile } from "../rag/fileProcessor.js";

export const router = Router();

// File upload configuration
const uploadDir = path.join(process.cwd(), "src", "storage", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Allowed file types
const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, MD, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter
});

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 15MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// API Routes
const apiRouter = Router();

// File upload endpoint
apiRouter.post("/files/upload", (req, res, next) => {
  console.log('File upload request received');
  
  upload.single("file")(req, res, async (err) => {
    try {
      console.log('Multer processing complete');
      
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ 
          success: false,
          error: err.message || 'File upload failed',
          details: err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds the limit' : undefined
        });
      }

      if (!req.file) {
        console.log('No file in request. Fields received:', Object.keys(req.body));
        return res.status(400).json({ 
          success: false,
          error: "No file uploaded. Please select a file to upload.",
          receivedFields: Object.keys(req.body)
        });
      }

      console.log('Processing uploaded file:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      try {
        const result = await uploadFile(req, res);
        
        if (!res.headersSent) {
          return res.json({ 
            success: true,
            message: "File processed successfully",
            documentId: result?.documentId,
            chunksProcessed: result?.chunksProcessed
          });
        }
      } catch (processError) {
        console.error('Error processing file:', processError);
        if (!res.headersSent) {
          return res.status(500).json({ 
            success: false,
            error: processError.message || "Failed to process file",
            details: processError.details
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error in file upload:", error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          success: false,
          error: "An unexpected error occurred while processing your request"
        });
      }
    }
  });
});

// Health check endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

// Chat/Ask endpoint
apiRouter.post("/ask", async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await askRag(question, topK);
    res.json(result);
  } catch (error) {
    console.error("Error in /ask endpoint:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while processing your question" 
    });
  }
});

// Ingest endpoint
const ingestUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
}).single('file');

apiRouter.post("/ingest", (req, res, next) => {
  ingestUpload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: err.message || 'File upload failed',
          details: err
        });
      }

      if (!req.file) {
        console.log('No file in request. Fields received:', Object.keys(req.body));
        return res.status(400).json({ 
          error: "No file uploaded",
          receivedFields: Object.keys(req.body)
        });
      }

      console.log('Processing file:', req.file.originalname);
      const result = await processFile({
        fileBuffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      if (!result || !result.upserted) {
        return res.status(400).json({ error: "No valid content found in file" });
      }

      res.json({ 
        ok: true, 
        message: "File processed successfully",
        documentId: result.documentId,
        chunksProcessed: result.upserted
      });
    } catch (error) {
      console.error("Processing error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process file" 
      });
    }
  });
});

// Page Routes
const pageRouter = Router();

pageRouter.get("/", (_req, res) => {
  res.render("home", { 
    layout: "layouts/main", 
    title: "Solar System Chatbot", 
  });
});

// Mount all routers
router.use("/api", apiRouter);
router.use("/", pageRouter);

export default router;
