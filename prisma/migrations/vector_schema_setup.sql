-- Production PostgreSQL / pgvector Schema Setup Script
-- Database: Neon PostgreSQL (VECTOR_DATABASE_URL)

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT,
    file_name TEXT,
    mime_type TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Chunks Table (Embedding vector size 1024 for Voyage-3)
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section TEXT,
    content TEXT NOT NULL,
    embedding vector(1024),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_document_chunk_index UNIQUE (document_id, chunk_index)
);

-- 4. B-Tree Indexes for Relational Queries, Filtering, and Document Versioning
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_section ON document_chunks(section);
CREATE INDEX IF NOT EXISTS idx_documents_file_name_title ON documents(file_name, title);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 5. HNSW Vector Index for Cosine Distance (<=>)
-- Matches query operator `dc.embedding <=> $1::vector` in vector.service.ts
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops);
