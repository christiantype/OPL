-- Vessel collaboration schema
-- Paste this whole file into the Supabase SQL editor and run it once.
--
-- Stores named iterations of a Vessel design (all 8 tracks + cover layout)
-- as a JSON payload, with author + timestamp. Both Cass and Christian
-- read/write through the anon key, since the page is already gated by
-- the OP/AL password — public anon access is acceptable for this audience.

create table if not exists public.vessel_iterations (
  id          bigserial primary key,
  name        text        not null default 'untitled',
  author      text        not null,
  payload     jsonb       not null,
  created_at  timestamptz not null default now()
);

create index if not exists vessel_iterations_created_at_idx
  on public.vessel_iterations (created_at desc);

-- Row-level security: allow the anon role to read + insert. (No update/delete
-- on purpose — every save creates a new immutable iteration, so history
-- never gets rewritten. Delete rows manually in the Supabase dashboard if
-- you need to prune.)
alter table public.vessel_iterations enable row level security;

drop policy if exists "anon read"   on public.vessel_iterations;
drop policy if exists "anon insert" on public.vessel_iterations;

create policy "anon read"
  on public.vessel_iterations for select
  to anon
  using (true);

create policy "anon insert"
  on public.vessel_iterations for insert
  to anon
  with check (true);
