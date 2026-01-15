import dotenv from "dotenv";
dotenv.config();

export const env = {
  // OPENROUTER config
  PORT: process.env.PORT || 3000,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  BASE_URL: process.env.BASE_URL,
  APP_TITLE: process.env.APP_TITLE || "RAG Chatbot",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "kwaipilot/kat-coder-pro:free",
  TEMPERATURE: Number(process.env.TEMPERATURE ?? "0.3"),

  // HuggingFace config
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "sentence-transformers/all-mpnet-base-v2",

  // Pinecone config
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
  PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE || "default",
  PINECONE_CLOUD: process.env.PINECONE_CLOUD,
  PINECONE_REGION: process.env.PINECONE_REGION,
};

if (!env.OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in .env");
  process.exit(1);
}

if (!env.HUGGINGFACE_API_KEY) {
  console.error("Missing HUGGINGFACE_API_KEY in .env");
  process.exit(1);
}

if (!env.PINECONE_API_KEY) {
  console.error("Missing PINECONE_API_KEY in .env");
  process.exit(1);
}

if (!env.PINECONE_INDEX_NAME) {
  console.error("Missing PINECONE_INDEX_NAME in .env");
  process.exit(1);
}
