-- SQL Migration: Backfill section metadata from content for existing chunks
UPDATE document_chunks
SET section = (regexp_match(content, '\[SECTION:\s*([^\]]+)\]', 'i'))[1]
WHERE (section IS NULL OR TRIM(section) = '')
  AND content ~* '\[SECTION:';
