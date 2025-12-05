
-- supabase/migrations/20251204094602_create_blips_table.sql

create table blips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  wave_id uuid references waves (id) on delete cascade not null,
  parent_id uuid references blips (id) on delete set null, -- Self-referencing for threading
  author_id uuid references auth.users (id) on delete cascade not null,
  content text not null,
  timestamp bigint not null, -- Original creation timestamp
  last_edited bigint, -- Last edit timestamp
  last_editor_id uuid references auth.users (id) on delete set null,
  gadgets jsonb, -- Storing interactive gadgets (JSONB)
  is_read_only boolean default false
);

alter table blips enable row level security;

-- Policy to allow authenticated users to view blips
create policy "Authenticated users can view blips."
  on blips for select
  using (auth.role() = 'authenticated'); -- This will be refined to check wave participation.

-- Policy to allow authenticated users to create blips
create policy "Authenticated users can create blips."
  on blips for insert
  with check (auth.role() = 'authenticated' and auth.uid() = author_id);

-- Policy to allow authors (or wave participants) to update blips
-- This needs to be refined to check wave participation.
create policy "Authors can update their own blips."
  on blips for update
  using (auth.uid() = author_id);

-- Policy to allow authors (or wave participants) to delete blips
-- This needs to be refined to check wave participation.
create policy "Authors can delete their own blips."
  on blips for delete
  using (auth.uid() = author_id);
