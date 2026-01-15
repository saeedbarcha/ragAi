# Migration Summary: OpenAI → HuggingFace Embeddings

## What Changed?

### Before (OpenAI text-embedding-3-small)
```javascript
// vectorstore.js
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  apiKey: env.OPENROUTER_API_KEY,
  modelName: env.OPENROUTER_EMBEDDING_MODEL, // "text-embedding-3-small"
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": env.BASE_URL,
      "X-Title": env.APP_TITLE
    }
  }
});
```

**Embedding Dimensions:** 1536
**Cost:** Pay-per-token through OpenRouter
**Provider:** OpenAI via OpenRouter

---

### After (HuggingFace all-mpnet-base-v2)
```javascript
// vectorstore.js
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: env.HUGGINGFACE_API_KEY,
  model: env.EMBEDDING_MODEL, // "sentence-transformers/all-mpnet-base-v2"
});
```

**Embedding Dimensions:** 768
**Cost:** FREE (with rate limits)
**Provider:** HuggingFace

---

## Configuration Changes

### .env File
```diff
- # Embeddings model (OpenRouter supports many, pick one that works for you)
- OPENROUTER_EMBEDDING_MODEL=text-embedding-3-small

+ # HuggingFace API Key (get from https://huggingface.co/settings/tokens)
+ HUGGINGFACE_API_KEY=your_huggingface_api_key_here
+
+ # Embeddings model - using HuggingFace all-mpnet-base-v2
+ EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
```

### env.js
```diff
- OPENROUTER_EMBEDDING_MODEL:
-   process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-3-small",

+ // HuggingFace config
+ HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
+ EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "sentence-transformers/all-mpnet-base-v2",
```

---

## Key Differences

| Feature | OpenAI (Before) | HuggingFace (After) |
|---------|----------------|---------------------|
| Model | text-embedding-3-small | all-mpnet-base-v2 |
| Dimensions | 1536 | 768 |
| Cost | Paid (per token) | Free (with limits) |
| Provider | OpenRouter/OpenAI | HuggingFace |
| API Key | OPENROUTER_API_KEY | HUGGINGFACE_API_KEY |
| Quality | Excellent | Excellent |
| Max Tokens | 8191 | 384 |

---

## Benefits of the Migration

✅ **Cost Savings:** Free tier available (no per-token costs)
✅ **Open Source:** Full transparency and community support
✅ **Privacy:** Can be run locally if needed (future option)
✅ **Performance:** Excellent for semantic search tasks
✅ **Flexibility:** Easy to switch to other HuggingFace models

---

## Important Notes

⚠️ **Pinecone Index Dimension Must Match:**
- Old: 1536 dimensions (for text-embedding-3-small)
- New: 768 dimensions (for all-mpnet-base-v2)
- **Action:** You may need to create a new Pinecone index with 768 dimensions

⚠️ **Existing Embeddings:**
- Any documents already embedded with the old model won't be compatible
- You'll need to re-upload and re-embed your documents

⚠️ **Rate Limits:**
- HuggingFace free tier has rate limits
- For production use, consider upgrading or running locally

---

## Next Steps

1. Get HuggingFace API key from https://huggingface.co/settings/tokens
2. Add it to your .env file
3. Verify Pinecone index dimension (768)
4. Re-upload your documents to create new embeddings
5. Test the system with queries

---

## Rollback (If Needed)

If you need to revert to OpenAI embeddings:

1. Restore the old import in vectorstore.js
2. Restore the old configuration in env.js
3. Update .env to use OPENROUTER_EMBEDDING_MODEL
4. Restart the server

The old configuration is preserved in your git history.
