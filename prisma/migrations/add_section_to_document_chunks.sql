-- SQL Migration: Add section metadata column to document_chunks
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS section TEXT;

CREATE INDEX IF NOT EXISTS idx_document_chunks_section
ON document_chunks(section);
