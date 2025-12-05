
-- supabase/migrations/20251204094516_initial_schema.sql

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  handle text unique,
  email text unique,
  avatar_url text,
  bio text,
  status text default 'online'::text,
  capacity text default 'medium'::text,
  access_needs text,
  color text,
  is_robot boolean default false
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using (true);

create policy "Users can insert their own profile."
  on profiles for insert
  with check ((auth.uid() = id));

create policy "Users can update own profile."
  on profiles for update
  using ((auth.uid() = id));


-- Create a table for Domains (Circles)
create table domains (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  name text not null unique,
  color text not null,
  description text,
  parent_id uuid references domains (id) on delete set null
);

alter table domains enable row level security;

create policy "Domains are viewable by everyone."
  on domains for select
  using (true);

create policy "Authenticated users can create domains."
  on domains for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update domains."
  on domains for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete domains."
  on domains for delete
  using (auth.role() = 'authenticated');


-- Create a table for Roles
create table roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  name text not null,
  domain_id uuid references domains (id) on delete cascade not null,
  description text,
  holder_ids uuid[] default '{}'::uuid[] not null, -- Array of user UUIDs
  term_end bigint -- Unix timestamp
);

alter table roles enable row level security;

create policy "Roles are viewable by everyone."
  on roles for select
  using (true);

create policy "Authenticated users can create roles."
  on roles for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update roles."
  on roles for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete roles."
  on roles for delete
  using (auth.role() = 'authenticated');

-- Set up trigger for new user inserts into profiles table
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Optional: Create a trigger to update 'updated_at' column automatically
create function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at_trigger
before update on profiles
for each row execute function update_updated_at_column();
