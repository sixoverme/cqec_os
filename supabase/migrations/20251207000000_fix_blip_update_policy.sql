-- Fix Blip Update Policy to match requirements:
-- 1. Root Blips: Editable by any participant.
-- 2. Non-Root Blips: Editable only by Author.
-- 3. DMs: Not editable.

-- Drop existing update policies
drop policy if exists "Authors and wave participants can update blips." on blips;
drop policy if exists "Authors can update their own blips." on blips;

create policy "Participants can update blips."
  on blips for update
  using (
    -- Must be participant
    (auth.uid() in (select user_id from wave_participants where wave_id = blips.wave_id))
    AND
    -- Wave must NOT be a DM
    (exists (
      select 1 from waves 
      where id = blips.wave_id 
      and is_dm is false
    ))
    AND
    (
      -- Case 1: Root Blip (parent_id is null) -> Editable by any participant
      (parent_id IS NULL)
      OR
      -- Case 2: Author -> Editable by Author
      (auth.uid() = author_id)
    )
  );
