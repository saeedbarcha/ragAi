import { embeddings } from "./embeddings.js";

const v = await embeddings.embedQuery("test");
console.log("Embedding dimension:", v.length);
