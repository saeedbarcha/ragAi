import { env } from "../config/env.js";
import { embeddings } from "./embeddings.js";
import { getPineconeIndex } from "./pineconeClient.js";

let vectorStorePromise = null;

export function getVectorStore() {
  if (!vectorStorePromise) vectorStorePromise = initVectorStore();
  return vectorStorePromise;
}

async function initVectorStore() {
  const index = getPineconeIndex();
  const namespace = env.PINECONE_NAMESPACE;

  return {
    // Used by ragChain.js
    similaritySearch: async (query, topK = 4) => {
      const qVector = await embeddings.embedQuery(query);

      const res = await index.namespace(namespace).query({
        vector: qVector,
        topK,
        includeMetadata: true,
      });

      return (res.matches || []).map((m) => ({
        pageContent: m.metadata?.text || "",
        metadata: {
          ...m.metadata,
          score: m.score,
        },
      }));
    },

    // Used by ingestion (PDF/TXT) to push chunks into Pinecone
    addDocuments: async (docs) => {
      await pineconeAddDocuments(index, namespace, docs);
    },
  };
}

async function pineconeAddDocuments(index, namespace, docs) {
  if (!Array.isArray(docs) || docs.length === 0) return;

  const texts = docs.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  const records = docs.map((d, i) => {
    const docId =
      d.metadata?.id ||
      d.metadata?.chunkId ||
      `${d.metadata?.documentId || "doc"}::${i}`;

    return {
      id: String(docId),
      values: vectors[i],
      metadata: {
        ...d.metadata,
        text: d.pageContent,
      },
    };
  });

  const batchSize = 80;
  for (let i = 0; i < records.length; i += batchSize) {
    await index.namespace(namespace).upsert(records.slice(i, i + batchSize));
  }
}
