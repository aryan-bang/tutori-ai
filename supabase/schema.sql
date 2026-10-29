-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null check (plan in ('pro', 'mentor')),
  status text not null check (status in ('active', 'past_due', 'inactive')),
  dodo_customer_id text,
  dodo_subscription_id text,
  product_id text,
  current_period_end timestamptz,
  event_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;

-- People can read their own rows. Nobody can write from the browser;
-- only the server (service role key) writes entitlements.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements for select using (auth.uid() = user_id);

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
