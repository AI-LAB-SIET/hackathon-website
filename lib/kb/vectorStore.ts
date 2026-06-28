// lib/kb/vectorStore.ts
/**
 * Simple in‑memory vector store used for the demo Knowledge Base.
 * Stores embeddings (as number[]), text chunks and their document reference.
 * Provides `addChunk` and `search` (cosine similarity) methods.
 * In production this will be replaced by a real vector DB (e.g., Pinecone, Qdrant).
 */

type Chunk = {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
};

class VectorStore {
  private chunks: Map<string, Chunk> = new Map();

  addChunk(chunk: Chunk) {
    this.chunks.set(chunk.id, chunk);
  }

  clear() {
    this.chunks.clear();
  }

  // cosine similarity between two vectors
  private cosine(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }

  /**
   * Search for the most similar chunks to the query embedding.
   * Returns up to `topK` chunks sorted by similarity descending.
   */
  search(queryEmbedding: number[], topK = 5) {
    const results: Array<{ chunk: Chunk; score: number }> = [];
    for (const chunk of this.chunks.values()) {
      const score = this.cosine(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).map(r => ({ ...r.chunk, score: r.score }));
  }
}

export const vectorStore = new VectorStore();
