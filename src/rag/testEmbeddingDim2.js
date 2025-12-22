import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../config/env.js";

const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const index = pc.index(env.PINECONE_INDEX_NAME);

const stats = await index.describeIndexStats();
console.log("Pinecone connected:", stats);
