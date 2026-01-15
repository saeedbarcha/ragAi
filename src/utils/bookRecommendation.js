
console.log('📚 BOOK RECOMMENDATION SYSTEM\n');
console.log('='.repeat(70));

// Our book library
const books = [
    "Harry Potter and the Sorcerer's Stone",
    "Harry Potter and the Chamber of Secrets",
    "The Hobbit",
    "Lord of the Rings",
    "The Great Gatsby",
    "Pride and Prejudice",
    "To Kill a Mockingbird"
];

console.log('\n📖 Our Book Library:');
books.forEach((book, i) => {
    console.log(`   ${i + 1}. ${book}`);
});


function getWords(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

function createVocabulary(bookTitles) {
    const allWords = new Set();
    bookTitles.forEach(title => {
        getWords(title).forEach(word => allWords.add(word));
    });
    return Array.from(allWords).sort();
}

function bookToVector(bookTitle, vocabulary) {
    const words = getWords(bookTitle);
    return vocabulary.map(word => {
        return words.filter(w => w === word).length;
    });
}

function magnitude(vector) {
    const sumOfSquares = vector.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares);
}


function dotProduct(vectorA, vectorB) {
    return vectorA.reduce((sum, val, i) => sum + val * vectorB[i], 0);
}

function cosineSimilarity(vectorA, vectorB) {
    const dot = dotProduct(vectorA, vectorB);
    const magA = magnitude(vectorA);
    const magB = magnitude(vectorB);
    if (magA === 0 || magB === 0) return 0;

    return dot / (magA * magB);
}

function recommendBooks(likedBook, allBooks) {
    console.log('\n' + '='.repeat(70));
    console.log(`🔍 You liked: "${likedBook}"`);
    console.log('='.repeat(70));

    const vocabulary = createVocabulary(allBooks);
    console.log(`\n📝 Vocabulary (${vocabulary.length} words): [${vocabulary.join(', ')}]\n`);

    const likedVector = bookToVector(likedBook, vocabulary);
    console.log(`Your book vector: [${likedVector.join(', ')}]`);

    const similarities = [];

    allBooks.forEach(book => {
        if (book === likedBook) return;

        const bookVector = bookToVector(book, vocabulary);
        const similarity = cosineSimilarity(likedVector, bookVector);
        similarities.push({
            title: book,
            vector: bookVector,
            similarity: similarity,
            percentage: (similarity * 100).toFixed(2)
        });
    });

    similarities.sort((a, b) => b.similarity - a.similarity);

    console.log('\n📊 Similarity Scores:\n');
    console.log('Rank | Similarity | Book Title');
    console.log('-'.repeat(70));

    similarities.forEach((item, index) => {
        const rank = `#${index + 1}`;
        const score = `${item.percentage}%`.padEnd(10);
        const emoji = item.similarity > 0.5 ? '🔥' : item.similarity > 0.3 ? '✅' : '📖';
        console.log(`${rank.padEnd(5)}| ${score} | ${emoji} ${item.title}`);
    });
    const bestMatch = similarities[0];
    console.log('\n' + '='.repeat(70));
    console.log('🏆 BEST RECOMMENDATION:');
    console.log('='.repeat(70));
    console.log(`\n"${bestMatch.title}"`);
    console.log(`Similarity Score: ${bestMatch.percentage}%`);
    console.log(`\n💡 Why? Because it shares many words with "${likedBook}"!`);

    return similarities;
}


const userLikes1 = "Harry Potter and the Sorcerer's Stone";
recommendBooks(userLikes1, books);

console.log('\n\n');
const userLikes2 = "The Hobbit";
recommendBooks(userLikes2, books);

