-- Õpitubade haldus ainult lubatud halduritele (mitte igale sisseloginud kasutajale).
-- Uue halduri lisamine: insert into public.workshop_admins (email) values ('nimi@näide.ee');

create table if not exists public.workshop_admins (
  email text primary key check (email = lower(email))
);

alter table public.workshop_admins enable row level security;
revoke all on public.workshop_admins from anon, authenticated;

insert into public.workshop_admins (email) values
  ('egon.sepp@gmail.com'),
  ('merisepp@gmail.com'),
  ('umarendus@gmail.com'),
  ('uudosepp@gmail.com'),
  ('saaremaalong@gmail.com')
on conflict do nothing;

create or replace function public.is_workshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshop_admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_workshop_admin() to anon, authenticated;

-- Õpitoad: kõik näevad avalikke, muuta saab ainult haldur
drop policy if exists "workshops public read" on public.workshops;
create policy "workshops public read" on public.workshops
  for select to anon, authenticated using (status <> 'draft' or public.is_workshop_admin());

drop policy if exists "workshops admin all" on public.workshops;
create policy "workshops admin all" on public.workshops
  for all to authenticated using (public.is_workshop_admin()) with check (public.is_workshop_admin());

-- Registreeringud (isikuandmed): ainult haldur
drop policy if exists "registrations admin all" on public.workshop_registrations;
create policy "registrations admin all" on public.workshop_registrations
  for all to authenticated using (public.is_workshop_admin()) with check (public.is_workshop_admin());

-- Galerii: kõik näevad, muuta saab ainult haldur
drop policy if exists "gallery admin write" on public.workshop_gallery;
create policy "gallery admin write" on public.workshop_gallery
  for all to authenticated using (public.is_workshop_admin()) with check (public.is_workshop_admin());

drop policy if exists "workshop photos admin insert" on storage.objects;
create policy "workshop photos admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'workshop-photos' and public.is_workshop_admin());

drop policy if exists "workshop photos admin delete" on storage.objects;
create policy "workshop photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'workshop-photos' and public.is_workshop_admin());
