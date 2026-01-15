
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../config/env.js";

async function resetIndex() {
    const indexName = env.PINECONE_INDEX_NAME;
    const dimension = 768;

    console.log('🔄 Connecting to Pinecone...');
    const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });

    // 1. Check if index exists
    console.log('🔍 Checking existing indexes...');
    const { indexes } = await pc.listIndexes();
    const exists = indexes.some(idx => idx.name === indexName);

    if (exists) {
        console.log(`🗑️  Index "${indexName}" found. Deleting... (This may take a moment)`);
        await pc.deleteIndex(indexName);
        console.log('✅ Index deleted successfully.');

        // Wait for deletion to propagate
        console.log('⏳ Waiting 10 seconds for deletion to allow re-creation...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
        console.log(`ℹ️  Index "${indexName}" does not exist.`);
    }

    // 2. Create new index
    console.log(`✨ Creating new index "${indexName}" with dimension ${dimension}...`);

    try {
        await pc.createIndex({
            name: indexName,
            dimension: dimension,
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: env.PINECONE_CLOUD || 'aws',
                    region: env.PINECONE_REGION || 'us-east-1',
                },
            },
        });
        console.log('✅ Index created successfully!');
        console.log('🚀 You can now restart your server and use the new model.');

    } catch (error) {
        if (error.message.includes('already exists')) {
            // Just in case of race condition or slow deletion
            console.log('⚠️ Index already exists (creation might have happened quickly). Verifying dimension...');
            const idx = await pc.describeIndex(indexName);
            if (idx.dimension === dimension) {
                console.log('✅ Existing index has correct dimensions.');
            } else {
                console.error(`❌ Error: Index exists with dimension ${idx.dimension}, but we need ${dimension}. Please run this script again after waiting a minute.`);
            }
        } else {
            console.error('❌ Error creating index:', error);
        }
    }
}

resetIndex();
