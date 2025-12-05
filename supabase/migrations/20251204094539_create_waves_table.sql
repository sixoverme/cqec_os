
-- supabase/migrations/20251204094539_create_waves_table.sql

create table waves (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  title text not null,
  type text not null default 'discussion', -- 'discussion', 'proposal', 'circle_home'
  folder text not null default 'inbox', -- 'inbox', 'archive', 'trash', 'spam'
  is_pinned boolean default false,
  last_activity bigint not null, -- Unix timestamp
  parent_id uuid references waves (id) on delete set null,
  is_dm boolean default false,
  domain_id uuid references domains (id) on delete set null,
  proposal_metadata jsonb -- Storing structured proposal data (JSONB)
);

alter table waves enable row level security;

-- Policy to allow authenticated users to create waves
create policy "Authenticated users can create waves."
  on waves for insert
  with check (auth.role() = 'authenticated');

-- Policy for viewing waves:
-- Users can view waves if they are a participant (handled by wave_participants table),
-- or if the wave is a 'circle_home' type and its domain is public (which all domains are by default with current RLS).
-- For now, let's allow select for all authenticated users to simplify initial setup.
-- We will refine this later with wave_participants join table.
create policy "Authenticated users can view waves."
  on waves for select
  using (auth.role() = 'authenticated');

-- Policy to allow participants to update waves (e.g., title, folder, is_pinned)
-- This will be refined once wave_participants table is in place.
create policy "Authenticated users can update their waves."
  on waves for update
  using (auth.role() = 'authenticated'); -- This needs to be more restrictive, checking participant status.

-- Policy to allow participants to delete waves
-- This will be refined once wave_participants table is in place.
create policy "Authenticated users can delete their waves."
  on waves for delete
  using (auth.role() = 'authenticated'); -- This needs to be more restrictive, checking participant status.
