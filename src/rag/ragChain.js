import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { llm } from "./llm.js";
import { getVectorStore } from "./vectorstore.js";

const ragPrompt = PromptTemplate.fromTemplate(`
You are an expert Solar System assistant.

Your task is to answer questions using the provided context retrieved from the vector database.
The context contains scientifically accurate information about planets, moons, stars, or other Solar System objects.

Rules:
- Use the information present in the context to answer the question.
- Do NOT add outside knowledge, assumptions, or general astronomy facts.
- If the context does not contain enough information to answer the question, respond exactly with:
  "I am not certain based on the provided context."
- Keep answers clear, factual, and concise.
- If numerical data (distance, mass, temperature, etc.) is present, include it exactly as stated.
- Do NOT mention Pinecone, embeddings, vectors, or the context itself.

Context:
{context}

User Question:
{question}

Answer:
`);


const chain = RunnableSequence.from([ragPrompt, llm, new StringOutputParser()]);

export async function askRag(question, topK = 4) {
  const store = await getVectorStore();
  const results = await store.similaritySearch(question, topK);

  const context =
    results.length > 0
      ? results.map((d, i) => `(${i + 1}) ${d.pageContent}`).join("\n\n")
      : "No relevant documents found.";

  const answer = await chain.invoke({ context, question });

 return {
  answer,
  sources: results
    .map((d) => d.metadata?.source)
    .filter(Boolean),
};
}
