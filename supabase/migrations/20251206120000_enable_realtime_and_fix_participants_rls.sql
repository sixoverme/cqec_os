-- Enable Realtime for all relevant tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table domains;
alter publication supabase_realtime add table roles;
alter publication supabase_realtime add table waves;
alter publication supabase_realtime add table blips;
alter publication supabase_realtime add table wave_participants;

-- Fix RLS for wave_participants to match the community read access model
-- Drop the restrictive policy
drop policy if exists "Participants can view their own wave_participant status." on wave_participants;

-- Create a new permissive policy
create policy "Authenticated users can view all wave participants."
  on wave_participants for select
  using (auth.role() = 'authenticated');
