-- =============================================================================
-- MIGRATION: Upgrade existing schema to production-ready version
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- 1. EXTENSIONS
-- =============================================================================
create extension if not exists vector;
create extension if not exists "uuid-ossp";


-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================================================

-- documents: add user_id, file_path, status, soft-delete, updated_at
alter table documents
  add column if not exists user_id    uuid references auth.users(id) on delete cascade,
  add column if not exists file_path  text,
  add column if not exists status     text not null default 'processing',
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone default timezone('utc', now()) not null;

-- Add CHECK constraint on status (safe to run multiple times)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_status_check'
  ) then
    alter table documents
      add constraint documents_status_check
      check (status in ('processing', 'ready', 'error'));
  end if;
end;
$$;

-- conversations: add updated_at if missing
alter table conversations
  add column if not exists updated_at timestamp with time zone default timezone('utc', now()) not null;

-- messages: make cited_sources default to empty array
alter table messages
  alter column cited_sources set default '[]';


-- 3. CREATE NEW TABLES IF NOT EXISTS
-- =============================================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  status      text not null default 'active' check (status in ('active', 'suspended')),
  daily_limit int not null default 50,
  monthly_limit int not null default 500,
  daily_usage int not null default 0,
  monthly_usage int not null default 0,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  updated_at  timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists query_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  query_text      text not null,
  chunks_returned int,
  top_similarity  float,
  latency_ms      int,
  created_at      timestamp with time zone default timezone('utc', now()) not null
);


-- 4. INDEXES
-- =============================================================================

-- Vector index (IVFFlat for fast cosine similarity)
create index if not exists idx_chunks_embedding
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists idx_chunks_document_id
  on document_chunks(document_id);

create index if not exists idx_documents_user_id
  on documents(user_id);

create index if not exists idx_conversations_user_id
  on conversations(user_id);

create index if not exists idx_messages_conversation_id
  on messages(conversation_id);


-- 5. TRIGGERS
-- =============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    status,
    daily_limit,
    monthly_limit,
    daily_usage,
    monthly_usage
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case
      when lower(coalesce(new.email, '')) in ('admin@itcs.com', 'admin@itc.com') then 'admin'
      else 'user'
    end,
    'active',
    50,
    500,
    0,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_documents_updated_at on documents;
create trigger set_documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();

drop trigger if exists set_conversations_updated_at on conversations;
create trigger set_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at_column();


-- 6. UPDATE RAG FUNCTION (scoped to auth.uid())
-- =============================================================================

create or replace function match_document_chunks (
  query_embedding  vector(768),
  match_threshold  float    default 0.5,
  match_count      int      default 10
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  inner join documents d on d.id = dc.document_id
  where
    (d.deleted_at is null)
    and (d.status = 'ready')
    and (d.user_id = auth.uid())
    and (1 - (dc.embedding <=> query_embedding) >= match_threshold)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;


-- 7. ENABLE RLS EVERYWHERE
-- =============================================================================

alter table profiles         enable row level security;
alter table documents        enable row level security;
alter table document_chunks  enable row level security;
alter table conversations    enable row level security;
alter table messages         enable row level security;
alter table query_logs       enable row level security;


-- 8. DROP OLD PERMISSIVE POLICIES
-- =============================================================================

drop policy if exists "Allow public read access to documents"       on documents;
drop policy if exists "Allow public read access to document_chunks" on document_chunks;
drop policy if exists "Service role can manage documents"           on documents;
drop policy if exists "Service role can manage document_chunks"     on document_chunks;
drop policy if exists "Users can manage their own conversations"    on conversations;
drop policy if exists "Users can manage messages of their conversations" on messages;


-- 9. SECURE POLICIES
-- =============================================================================

-- profiles
drop policy if exists "Users can view own profile"   on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- documents (scoped to owner)
drop policy if exists "Users can manage own documents" on documents;

create policy "Users can manage own documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- document_chunks (scoped through parent document owner)
drop policy if exists "Users can read own chunks"   on document_chunks;
drop policy if exists "Users can insert own chunks" on document_chunks;
drop policy if exists "Users can delete own chunks" on document_chunks;

create policy "Users can read own chunks"
  on document_chunks for select
  using (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert own chunks"
  on document_chunks for insert
  with check (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "Users can delete own chunks"
  on document_chunks for delete
  using (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

-- conversations
drop policy if exists "Users can manage own conversations" on conversations;

create policy "Users can manage own conversations"
  on conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- messages
drop policy if exists "Users can manage messages in own conversations" on messages;

create policy "Users can manage messages in own conversations"
  on messages for all
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- query_logs
drop policy if exists "Users can insert own logs" on query_logs;
drop policy if exists "Users can read own logs"   on query_logs;

create policy "Users can insert own logs"
  on query_logs for insert with check (auth.uid() = user_id);

create policy "Users can read own logs"
  on query_logs for select using (auth.uid() = user_id);


-- 10. STORAGE BUCKET & POLICIES
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "Allow authenticated uploads to documents bucket"  on storage.objects;
drop policy if exists "Allow authenticated users to read documents"      on storage.objects;
drop policy if exists "Service role can manage documents bucket"         on storage.objects;
drop policy if exists "Authenticated users can upload own documents"     on storage.objects;
drop policy if exists "Authenticated users can read own documents"       on storage.objects;
drop policy if exists "Authenticated users can delete own documents"     on storage.objects;

create policy "Authenticated users can upload own documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can read own documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can delete own documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
