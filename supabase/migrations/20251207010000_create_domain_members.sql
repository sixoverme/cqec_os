-- Create domain_members table
create table domain_members (
  domain_id uuid references domains (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  primary key (domain_id, user_id)
);

-- Enable RLS
alter table domain_members enable row level security;

-- Policies for domain_members
create policy "Domain members are viewable by everyone."
  on domain_members for select
  using (true);

create policy "Authenticated users can join domains."
  on domain_members for insert
  with check (auth.role() = 'authenticated'); -- Allow joining. Refine if needed (e.g., invite only).

create policy "Users can leave domains."
  on domain_members for delete
  using (auth.uid() = user_id);

-- Add to Realtime
alter publication supabase_realtime add table domain_members;

-- Function to auto-join root domains
create or replace function public.auto_join_root_domains()
returns trigger as $$
begin
  insert into public.domain_members (domain_id, user_id)
  select id, new.id
  from public.domains
  where parent_id is null
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on profile creation (which happens on user signup)
create trigger on_profile_created_join_roots
  after insert on public.profiles
  for each row execute procedure public.auto_join_root_domains();

-- Backfill: Add all existing users to all existing root domains
insert into domain_members (domain_id, user_id)
select d.id, p.id
from domains d
cross join profiles p
where d.parent_id is null
on conflict do nothing;
