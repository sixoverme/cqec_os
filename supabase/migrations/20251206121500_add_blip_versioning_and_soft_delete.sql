
-- supabase/migrations/20251206121500_add_blip_versioning_and_soft_delete.sql

-- 1. Add 'deleted_at' to 'blips' for Soft Deletes
alter table blips add column deleted_at timestamp with time zone;

-- 2. Create 'blip_versions' table for history
create table blip_versions (
  id uuid primary key default gen_random_uuid(),
  blip_id uuid references blips (id) on delete cascade not null,
  created_at timestamp with time zone default now() not null, -- When this version was created (i.e., time of edit)
  content text not null,
  editor_id uuid references auth.users (id) on delete set null
);

-- 3. Enable RLS on 'blip_versions'
alter table blip_versions enable row level security;

-- 4. Realtime
alter publication supabase_realtime add table blip_versions;

-- 5. Policies for 'blip_versions'
-- Anyone who can view the parent blip should be able to view its versions
-- (Reusing the logic: Authenticated users can view all blips)
create policy "Authenticated users can view blip versions."
  on blip_versions for select
  using (auth.role() = 'authenticated');

-- Authors/Editors can insert versions (handled by app logic, but good to permit)
create policy "Authenticated users can create blip versions."
  on blip_versions for insert
  with check (auth.role() = 'authenticated');
