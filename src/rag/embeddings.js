import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env.js";

export const embeddings = new OpenAIEmbeddings({
  apiKey: env.OPENROUTER_API_KEY,
  modelName: env.OPENROUTER_EMBEDDING_MODEL,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": env.BASE_URL,
      "X-Title": env.APP_TITLE
    }
  }
});
