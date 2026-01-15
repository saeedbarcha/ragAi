# Cosine Similarity Implementation

## Overview

This RAG chatbot uses **cosine similarity** to measure the semantic similarity between document embeddings and query embeddings. The implementation ensures accurate similarity calculations using proper vector normalization.

## Mathematical Formula

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Where:
- `A · B` = Dot product of vectors A and B
- `||A||` = Magnitude (L2 norm) of vector A = √(Σ(a_i²))
- `||B||` = Magnitude (L2 norm) of vector B = √(Σ(b_i²))

## Why Cosine Similarity?

Cosine similarity is ideal for semantic search because:

1. **Direction over Magnitude**: Measures the angle between vectors, not their length
2. **Normalized Range**: Returns values between -1 and 1 (or 0 and 1 for positive embeddings)
3. **Semantic Meaning**: Captures semantic similarity regardless of document length
4. **Industry Standard**: Used by most embedding models including `all-mpnet-base-v2`

## Implementation Details

### Vector Normalization

Our implementation normalizes all vectors before storage and querying:

```javascript
function normalizeVector(vector) {
  // Calculate the magnitude (L2 norm): ||vector|| = sqrt(sum(x^2))
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  
  // Avoid division by zero
  if (magnitude === 0) {
    return vector;
  }
  
  // Return normalized vector: vector / ||vector||
  return vector.map(val => val / magnitude);
}
```

### Why Normalize?

When vectors are normalized (magnitude = 1), the cosine similarity formula simplifies:

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
                        = (A · B) / (1 × 1)
                        = A · B
```

This means:
- **Faster computation**: Only need dot product, not magnitude calculations
- **Pinecone optimization**: Pinecone can use optimized dot product operations
- **Numerical stability**: Reduces floating-point errors

### Storage Process

1. **Document Upload** → Text extracted
2. **Text Chunking** → Split into manageable pieces
3. **Embedding Generation** → HuggingFace `all-mpnet-base-v2` creates 768-dim vectors
4. **Vector Normalization** → Each vector is normalized to unit length
5. **Pinecone Storage** → Normalized vectors stored with metadata

```javascript
async addDocuments(documents) {
  const texts = documents.map(d => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);
  
  const records = documents.map((doc, i) => {
    // Normalize the vector for proper cosine similarity
    const normalizedVector = normalizeVector(vectors[i]);
    
    return {
      id: `${metadata.documentId}::${metadata.chunkIndex}`,
      values: normalizedVector,  // ← Normalized!
      metadata: { ...metadata, text: doc.pageContent }
    };
  });
  
  await index.namespace(namespace).upsert(records);
}
```

### Query Process

1. **User Query** → "What is the main topic?"
2. **Query Embedding** → HuggingFace creates 768-dim query vector
3. **Vector Normalization** → Query vector normalized to unit length
4. **Similarity Search** → Pinecone finds most similar vectors using cosine similarity
5. **Results Returned** → Top-K most similar documents with similarity scores

```javascript
async similaritySearch(query, topK = 4) {
  const qVector = await embeddings.embedQuery(query);
  // Normalize the query vector for proper cosine similarity
  const normalizedQueryVector = normalizeVector(qVector);
  
  const res = await index.namespace(namespace).query({
    vector: normalizedQueryVector,  // ← Normalized!
    topK,
    includeMetadata: true,
  });
  
  return res.matches.map(match => ({
    pageContent: match.metadata.text,
    metadata: {
      ...match.metadata,
      score: match.score  // ← Cosine similarity score (0 to 1)
    }
  }));
}
```

## Similarity Score Interpretation

The `score` returned by Pinecone represents the cosine similarity:

| Score Range | Interpretation |
|-------------|----------------|
| 0.9 - 1.0   | Extremely similar (near identical) |
| 0.7 - 0.9   | Very similar (highly relevant) |
| 0.5 - 0.7   | Moderately similar (somewhat relevant) |
| 0.3 - 0.5   | Slightly similar (loosely related) |
| 0.0 - 0.3   | Not similar (unrelated) |

## Pinecone Index Configuration

For cosine similarity to work correctly, your Pinecone index should be configured with:

```javascript
{
  name: "chatrag",
  dimension: 768,           // Must match all-mpnet-base-v2 output
  metric: "cosine",         // ← Cosine similarity metric
  cloud: "aws",
  region: "us-east-1"
}
```

### Checking Your Index Configuration

1. Go to https://app.pinecone.io/
2. Select your index (`chatrag`)
3. Verify:
   - **Dimension**: 768
   - **Metric**: cosine

### Creating a New Index (if needed)

If your index uses a different metric or dimension:

```python
# Using Pinecone Python SDK
import pinecone

pinecone.create_index(
    name="chatrag",
    dimension=768,
    metric="cosine",  # ← Important!
    cloud="aws",
    region="us-east-1"
)
```

Or via Pinecone Console:
1. Click "Create Index"
2. Name: `chatrag`
3. Dimensions: `768`
4. Metric: Select **"cosine"**
5. Cloud: AWS
6. Region: us-east-1

## Alternative Similarity Metrics

While we use **cosine similarity**, Pinecone supports other metrics:

### Euclidean Distance
```
distance = √(Σ(a_i - b_i)²)
```
- Measures straight-line distance between vectors
- Sensitive to magnitude
- Not ideal for semantic search

### Dot Product
```
similarity = Σ(a_i × b_i)
```
- Fast computation
- Requires normalized vectors (same as our implementation)
- Equivalent to cosine similarity when vectors are normalized

## Performance Considerations

### Why Normalization is Efficient

1. **Pre-computation**: Normalization happens once during storage
2. **Query Speed**: Pinecone can use optimized dot product
3. **Batch Processing**: Multiple vectors normalized in parallel
4. **Memory**: No additional storage overhead

### Optimization Tips

1. **Batch Uploads**: Upload documents in batches (we use 80 per batch)
2. **Async Operations**: All embedding operations are async
3. **Caching**: HuggingFace may cache embeddings
4. **Index Warmup**: First queries may be slower (Pinecone warming up)

## Verification

To verify cosine similarity is working correctly:

### Test 1: Identical Documents
Upload the same document twice → Should get similarity score ≈ 1.0

### Test 2: Related Documents
Upload related documents → Should get similarity score > 0.7

### Test 3: Unrelated Documents
Upload completely different topics → Should get similarity score < 0.3

### Manual Calculation Example

```javascript
// Two normalized vectors
const A = [0.6, 0.8];  // ||A|| = 1
const B = [0.8, 0.6];  // ||B|| = 1

// Cosine similarity = A · B
const similarity = A[0] * B[0] + A[1] * B[1];
// = 0.6 * 0.8 + 0.8 * 0.6
// = 0.48 + 0.48
// = 0.96 (very similar!)
```

## Troubleshooting

### Issue: Low Similarity Scores for Related Content

**Possible Causes:**
1. Vectors not normalized properly
2. Wrong Pinecone metric (should be "cosine")
3. Embedding model mismatch

**Solution:**
- Verify normalization function is being called
- Check Pinecone index metric setting
- Re-upload documents after fixing

### Issue: All Scores are 1.0

**Possible Causes:**
1. Same document uploaded multiple times
2. Duplicate embeddings

**Solution:**
- Check document IDs
- Clear namespace and re-upload

### Issue: Negative Similarity Scores

**Possible Causes:**
1. Pinecone using dot product without normalization
2. Vectors not normalized

**Solution:**
- Ensure normalization is applied
- Verify Pinecone metric is "cosine"

## References

- [Cosine Similarity - Wikipedia](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Pinecone Similarity Metrics](https://docs.pinecone.io/docs/indexes#distance-metrics)
- [all-mpnet-base-v2 Model Card](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
- [Vector Normalization](https://en.wikipedia.org/wiki/Unit_vector)

## Summary

✅ **Cosine similarity** measures semantic similarity between embeddings
✅ **Vector normalization** ensures accurate and efficient calculations
✅ **Formula**: `cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)`
✅ **Implementation**: Normalize all vectors before storage and querying
✅ **Pinecone metric**: Must be set to "cosine"
✅ **Score range**: 0 (unrelated) to 1 (identical)
