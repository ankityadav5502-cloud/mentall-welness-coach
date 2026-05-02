-- ============================================================
-- RAG Chatbot + Journal Reflector — Database Migration
-- ============================================================

-- 1. Enable pgvector extension for embedding storage
create extension if not exists vector with schema extensions;

-- ============================================================
-- 2. DOCUMENT EMBEDDINGS (vector store for user content)
-- ============================================================
create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_type text not null check (source_type in ('journal', 'mood', 'medication_note')),
  source_id uuid not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for fast cosine similarity search
create index on public.document_embeddings
  using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 100);

-- Unique constraint: one embedding per source document
create unique index on public.document_embeddings (source_type, source_id);

-- ============================================================
-- 3. KNOWLEDGE BASE (curated mental health content)
-- ============================================================
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  embedding extensions.vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index on public.knowledge_documents
  using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 50);

-- ============================================================
-- 4. AI CHAT SESSIONS
-- ============================================================
create table public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 5. AI CHAT MESSAGES
-- ============================================================
create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.ai_chat_sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. JOURNAL REFLECTIONS (cached AI reflections)
-- ============================================================
create table public.journal_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  journal_entry_id uuid references public.journal_entries(id) on delete cascade not null,
  reflection text not null,
  themes text[] default '{}',
  created_at timestamptz default now(),
  unique(journal_entry_id)
);

-- ============================================================
-- 7. VECTOR SIMILARITY SEARCH FUNCTIONS
-- ============================================================

-- Search user's personal embeddings
create or replace function match_user_documents(
  query_embedding extensions.vector(1536),
  match_user_id uuid,
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    de.id,
    de.source_type,
    de.source_id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  where de.user_id = match_user_id
    and 1 - (de.embedding <=> query_embedding) > match_threshold
  order by de.embedding <=> query_embedding
  limit match_count;
$$;

-- Search curated knowledge base
create or replace function match_knowledge(
  query_embedding extensions.vector(1536),
  match_count int default 3,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  category text,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    kd.id,
    kd.category,
    kd.title,
    kd.content,
    1 - (kd.embedding <=> query_embedding) as similarity
  from public.knowledge_documents kd
  where kd.embedding is not null
    and 1 - (kd.embedding <=> query_embedding) > match_threshold
  order by kd.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table public.document_embeddings enable row level security;
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.journal_reflections enable row level security;
alter table public.knowledge_documents enable row level security;

-- document_embeddings
create policy "Users can view own embeddings"
  on public.document_embeddings for select using (auth.uid() = user_id);
create policy "Users can insert own embeddings"
  on public.document_embeddings for insert with check (auth.uid() = user_id);
create policy "Users can update own embeddings"
  on public.document_embeddings for update using (auth.uid() = user_id);

-- ai_chat_sessions
create policy "Users can manage own sessions"
  on public.ai_chat_sessions for all using (auth.uid() = user_id);

-- ai_chat_messages (access via session ownership)
create policy "Users can view own chat messages"
  on public.ai_chat_messages for select
  using (session_id in (select id from public.ai_chat_sessions where user_id = auth.uid()));
create policy "Users can insert own chat messages"
  on public.ai_chat_messages for insert
  with check (session_id in (select id from public.ai_chat_sessions where user_id = auth.uid()));

-- journal_reflections
create policy "Users can view own reflections"
  on public.journal_reflections for select using (auth.uid() = user_id);
create policy "Users can insert own reflections"
  on public.journal_reflections for insert with check (auth.uid() = user_id);

-- knowledge_documents: readable by all authenticated users
create policy "Authenticated users can read knowledge base"
  on public.knowledge_documents for select using (auth.role() = 'authenticated');
