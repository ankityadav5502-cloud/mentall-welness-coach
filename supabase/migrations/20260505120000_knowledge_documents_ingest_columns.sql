-- Columns used by scripts/ingest-pdfs.ts for chunked book ingestion
alter table public.knowledge_documents
  add column if not exists source_file text,
  add column if not exists chunk_index integer;

create index if not exists knowledge_documents_source_file_idx
  on public.knowledge_documents (source_file)
  where source_file is not null;
