
-- supabase/migrations/20251204094631_create_wave_participants_table.sql

-- Create a table to manage wave participants (many-to-many relationship)
create table wave_participants (
  wave_id uuid references waves (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default now() not null,
  
  primary key (wave_id, user_id)
);

alter table wave_participants enable row level security;

create policy "Participants can view their own wave_participant status."
  on wave_participants for select
  using (auth.uid() = user_id);

create policy "Authenticated users can add participants."
  on wave_participants for insert
  with check (auth.role() = 'authenticated'); -- This needs to be refined for who can add, e.g. wave author. For now, authenticated.

create policy "Participants can update their own wave_participant status (e.g. is_read)."
  on wave_participants for update
  using (auth.uid() = user_id);

create policy "Participants can leave a wave."
  on wave_participants for delete
  using (auth.uid() = user_id);


-- Refine RLS for 'waves' table
-- Drop existing policies
drop policy if exists "Authenticated users can view waves." on waves;
drop policy if exists "Authenticated users can update their waves." on waves;
drop policy if exists "Authenticated users can delete their waves." on waves;

-- New select policy for waves
create policy "Participants can view waves."
  on waves for select
  using (
    (auth.uid() in (select user_id from wave_participants where wave_id = waves.id))
    or (waves.type = 'circle_home') -- Allow viewing circle homes by default
  );

-- New update policy for waves
create policy "Participants can update waves."
  on waves for update
  using (auth.uid() in (select user_id from wave_participants where wave_id = waves.id));

-- New delete policy for waves
create policy "Participants can delete waves."
  on waves for delete
  using (auth.uid() in (select user_id from wave_participants where wave_id = waves.id));


-- Refine RLS for 'blips' table
-- Drop existing policies
drop policy if exists "Authenticated users can view blips." on blips;
drop policy if exists "Authors can update their own blips." on blips;
drop policy if exists "Authors can delete their own blips." on blips;

-- New select policy for blips
create policy "Participants can view blips."
  on blips for select
  using (auth.uid() in (select user_id from wave_participants where wave_id = blips.wave_id));

-- New update policy for blips
create policy "Authors and wave participants can update blips."
  on blips for update
  using (
    (auth.uid() = author_id)
    and (auth.uid() in (select user_id from wave_participants where wave_id = blips.wave_id))
  );

-- New delete policy for blips
create policy "Authors and wave participants can delete blips."
  on blips for delete
  using (
    (auth.uid() = author_id)
    and (auth.uid() in (select user_id from wave_participants where wave_id = blips.wave_id))
  );
