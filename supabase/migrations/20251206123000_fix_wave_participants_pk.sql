-- supabase/migrations/20251206123000_fix_wave_participants_pk.sql

-- 1. Drop the existing composite primary key
alter table wave_participants drop constraint wave_participants_pkey;

-- 2. Add a new 'id' column
alter table wave_participants add column id uuid default gen_random_uuid() primary key;

-- 3. Re-add the uniqueness constraint for wave_id + user_id
alter table wave_participants add constraint wave_participants_wave_user_unique unique (wave_id, user_id);