
-- 1. Function: When a user joins a domain, add them to all existing waves in that domain
CREATE OR REPLACE FUNCTION public.handle_new_domain_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wave_participants (wave_id, user_id, is_read)
  SELECT id, NEW.user_id, FALSE
  FROM public.waves
  WHERE domain_id = NEW.domain_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for New Members
DROP TRIGGER IF EXISTS on_domain_member_added_sync_waves ON public.domain_members;
CREATE TRIGGER on_domain_member_added_sync_waves
  AFTER INSERT ON public.domain_members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_domain_member();

-- 3. Function: When a new wave is created in a domain, add all domain members as participants
CREATE OR REPLACE FUNCTION public.handle_new_domain_wave()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.domain_id IS NOT NULL THEN
    INSERT INTO public.wave_participants (wave_id, user_id, is_read)
    SELECT NEW.id, user_id, FALSE
    FROM public.domain_members
    WHERE domain_id = NEW.domain_id
    AND user_id != NEW.owner_id -- Exclude owner if they are already added by default logic? 
    -- Actually, waves don't have 'owner_id' column explicitly in schema, usually it's implicit or via initial participant.
    -- Let's just Insert Ignore.
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for New Waves
DROP TRIGGER IF EXISTS on_wave_created_sync_members ON public.waves;
CREATE TRIGGER on_wave_created_sync_members
  AFTER INSERT ON public.waves
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_domain_wave();

-- 5. Backfill: Add existing domain members to existing waves
-- (Useful if there are members who joined before this trigger existed)
INSERT INTO public.wave_participants (wave_id, user_id, is_read)
SELECT w.id, dm.user_id, FALSE
FROM public.waves w
JOIN public.domain_members dm ON w.domain_id = dm.domain_id
ON CONFLICT DO NOTHING;
