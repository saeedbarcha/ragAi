import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";

export const llm = new ChatOpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  modelName: env.OPENROUTER_MODEL,
  temperature: env.TEMPERATURE,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": env.BASE_URL,
      "X-Title": env.APP_TITLE
    }
  }
});
