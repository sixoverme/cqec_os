-- supabase/migrations/20251205123237_update_rls_for_community_read_access.sql

-- Drop existing restrictive SELECT policies
drop policy if exists "Participants can view waves." on waves;
drop policy if exists "Participants can view blips." on blips;

-- New SELECT policy for waves: Allow all authenticated users to view waves
create policy "Authenticated users can view all waves."
  on waves for select
  using (auth.role() = 'authenticated');

-- New SELECT policy for blips: Allow all authenticated users to view blips
create policy "Authenticated users can view all blips."
  on blips for select
  using (auth.role() = 'authenticated');

-- Optional: Re-evaluate INSERT/UPDATE/DELETE policies if community-wide write access is desired
-- For now, we assume original INSERT/UPDATE/DELETE policies (based on wave_participants or author_id) are sufficient
