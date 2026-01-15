// ragChain.js
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { llm, vectorStore } from "./ragCore.js";

const ragPrompt = PromptTemplate.fromTemplate(`
You are a helpful and precise knowledge assistant.

Your task is to answer questions using ONLY the provided context retrieved from the uploaded documents.

Rules:
- Use only the information present in the context to answer the question.
- Do NOT add outside knowledge, assumptions, or general facts not supported by the context.
- If the context does not contain enough information to answer fully, state clearly what is missing or say: "I cannot find the answer in the provided documents."
- Keep answers clear, factual, and concise.
- Include numerical data exactly as stated in the context.

Context:
{context}

User Question:
{question}

Answer:
`);

const chain = RunnableSequence.from([ragPrompt, llm, new StringOutputParser()]);

export async function askRag(question, topK = 6) {
  try {
    const results = await vectorStore.similaritySearch(question, topK);
    const context = results.length > 0
      ? results.map((d, i) => `(${i + 1}) ${d.pageContent}`).join("\n\n")
      : "No relevant documents found.";

    const answer = await chain.invoke({ context, question });

    return {
      answer,
      sources: [...new Set(results.map(d => d.metadata?.source).filter(Boolean))],
      scores: results.map(d => d.metadata?.score || 0) // Include cosine similarity scores
    };
  } catch (error) {
    console.error("Error in askRag:", error);
    return {
      answer: "I'm sorry, I encountered an error while processing your request.",
      sources: []
    };
  }
}