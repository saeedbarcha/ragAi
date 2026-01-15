# Embedding Model Migration: all-mpnet-base-v2

## ✅ Changes Completed

I've successfully migrated your RAG chatbot from OpenAI's `text-embedding-3-small` to HuggingFace's `all-mpnet-base-v2` model.

### Files Modified:

1. **package.json** - Added `@langchain/community` dependency
2. **.env** - Updated embedding configuration
3. **src/config/env.js** - Added HuggingFace configuration and validation
4. **src/rag/vectorstore.js** - Replaced OpenAI embeddings with HuggingFace embeddings

## 🔑 Next Steps: Get Your HuggingFace API Key

To complete the setup, you need to get a **FREE** HuggingFace API key:

### Step 1: Create/Login to HuggingFace Account
1. Go to https://huggingface.co/
2. Sign up or log in to your account

### Step 2: Generate API Token
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Give it a name (e.g., "RAG Chatbot")
4. Select "Read" access (this is sufficient for embeddings)
5. Click "Generate token"
6. Copy the token (it starts with `hf_...`)

### Step 3: Update Your .env File
Open `d:/rag-chat/rag-backend/.env` and replace:
```
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

With your actual token:
```
HUGGINGFACE_API_KEY=hf_your_actual_token_here
```

## 📊 Model Information

**Model:** `sentence-transformers/all-mpnet-base-v2`
- **Dimensions:** 768 (make sure your Pinecone index supports this)
- **Max Sequence Length:** 384 tokens
- **Performance:** Excellent for semantic search and retrieval tasks
- **License:** Apache 2.0

## ⚠️ Important: Pinecone Index Dimension

The `all-mpnet-base-v2` model produces **768-dimensional** embeddings.

**Check your Pinecone index dimension:**
- If your current index is configured for a different dimension (e.g., 1536 for text-embedding-3-small), you'll need to:
  1. Create a new Pinecone index with 768 dimensions, OR
  2. Delete and recreate your existing index with 768 dimensions

**To check your current index dimension:**
1. Go to https://app.pinecone.io/
2. Select your index (`chatrag`)
3. Check the "Dimensions" field

## 🚀 Testing the Setup

After adding your HuggingFace API key:

1. **Restart the backend server** (it should restart automatically if using `npm run dev`)
2. **Upload a test document** through your frontend
3. **Ask a question** to verify embeddings are working

## 🔍 Troubleshooting

### Error: "Missing HUGGINGFACE_API_KEY in .env"
- Make sure you've added your HuggingFace API key to the `.env` file
- Ensure there are no extra spaces or quotes around the key

### Error: Dimension mismatch in Pinecone
- Your Pinecone index needs to be configured for 768 dimensions
- Create a new index or reconfigure the existing one

### Error: Rate limiting
- HuggingFace free tier has rate limits
- Consider upgrading if you need higher throughput

## 📝 Configuration Summary

Your current configuration in `.env`:
```bash
# HuggingFace API Key
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Embeddings model - using HuggingFace all-mpnet-base-v2
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
```

## 🎯 Benefits of all-mpnet-base-v2

1. **Free to use** - No per-token costs like OpenAI
2. **High quality** - Excellent performance on semantic similarity tasks
3. **Open source** - Full transparency and community support
4. **Privacy** - Can be run locally if needed (future enhancement)

---

**Need help?** Check the HuggingFace documentation: https://huggingface.co/sentence-transformers/all-mpnet-base-v2
