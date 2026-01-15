import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { env } from "../config/env.js";

const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const index = pc.index(env.PINECONE_INDEX_NAME);
const namespace = env.PINECONE_NAMESPACE;

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: env.HUGGINGFACE_API_KEY,
  model: env.EMBEDDING_MODEL,
});
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map(val => val / magnitude);
}

export const vectorStore = {
  async addDocuments(documents) {
    if (!Array.isArray(documents) || documents.length === 0) return;

    const texts = documents.map(d => d.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    const records = documents.map((doc, i) => {
      const metadata = doc.metadata || {};
      const normalizedVector = normalizeVector(vectors[i]);

      return {
        id: `${metadata.documentId || "doc"}::${metadata.chunkIndex || i}`,
        values: normalizedVector,
        metadata: {
          ...metadata,
          text: doc.pageContent
        }
      };
    });

    const batchSize = 80;
    for (let i = 0; i < records.length; i += batchSize) {
      await index.namespace(namespace).upsert(records.slice(i, i + batchSize));
    }
  },

  async similaritySearch(query, topK = 4) {
    const qVector = await embeddings.embedQuery(query);
    const normalizedQueryVector = normalizeVector(qVector);

    const res = await index.namespace(namespace).query({
      vector: normalizedQueryVector,
      topK,
      includeMetadata: true,
    });

    return (res.matches || []).map(match => ({
      pageContent: match?.metadata?.text || "",
      metadata: {
        ...match.metadata,
        score: match?.score
      }
    }));
  }
};