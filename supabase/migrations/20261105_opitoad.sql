-- Õpitubade registreerimine: tabelid, turvareeglid, pildipank ja esimene õpituba.
-- Käivita Supabase'i SQL Editoris (Project -> SQL Editor -> New query) ühe korraga.

-- ---------------------------------------------------------------------------
-- Õpitoad
-- ---------------------------------------------------------------------------
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  duration_text text not null default '',          -- nt "umbes 4 tundi"
  location text not null default '',
  price_eur numeric(8,2) not null default 0,
  payment_note text not null default 'Maksmine kohapeal',
  includes text not null default '',               -- mida hinna eest saab
  extras text not null default '',                 -- mida saab juurde osta
  capacity int not null check (capacity >= 0),
  reserved_offline int not null default 0 check (reserved_offline >= 0), -- väljaspool lehte broneeritud kohad
  image_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Registreeringud (workshop_id = null -> üldine huviliste nimekiri)
-- ---------------------------------------------------------------------------
create table if not exists public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  participants int not null default 1 check (participants between 1 and 20),
  extra_participants jsonb not null default '[]'::jsonb, -- kaasosalejad: [{"name": "...", "email": "...", "phone": "..."}]
  wants_materials boolean not null default false,  -- soovib tapikangaspuid / villavorsti juurde osta
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'waitlist')),
  ip_hash text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists workshop_registrations_workshop_idx on public.workshop_registrations (workshop_id, status);
create index if not exists workshop_registrations_ip_idx on public.workshop_registrations (ip_hash, created_at);

-- Sama e-postiga ei saa samale õpitoale kaks korda aktiivset registreeringut teha
create unique index if not exists workshop_registrations_unique_email
  on public.workshop_registrations (workshop_id, lower(email))
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- Galerii
-- ---------------------------------------------------------------------------
create table if not exists public.workshop_gallery (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops(id) on delete set null,
  image_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vabade kohtade arvutus
-- ---------------------------------------------------------------------------
create or replace function public.workshop_seats_taken(w_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(w.reserved_offline, 0) + coalesce((
    select sum(r.participants)::int
    from public.workshop_registrations r
    where r.workshop_id = w_id and r.status in ('pending', 'confirmed')
  ), 0)
  from public.workshops w
  where w.id = w_id;
$$;

-- Avalik nimekiri ilma isikuandmeteta
create or replace view public.workshops_public
with (security_invoker = false) as
select
  w.id, w.title, w.description, w.starts_at, w.duration_text, w.location,
  w.price_eur, w.payment_note, w.includes, w.extras, w.capacity, w.image_url, w.status,
  greatest(w.capacity - public.workshop_seats_taken(w.id), 0) as seats_left
from public.workshops w
where w.status <> 'draft';

-- Registreerimine lukustab õpitoa rea, et kaks samaaegset registreerijat ei saaks viimast kohta
create or replace function public.register_for_workshop(
  p_workshop_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_participants int,
  p_wants_materials boolean,
  p_message text,
  p_ip_hash text,
  p_extra_participants jsonb default '[]'::jsonb
)
returns table (registration_id uuid, reg_status text, seats_left int)
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.workshops%rowtype;
  left_now int;
  new_status text;
  new_id uuid;
begin
  if p_workshop_id is null then
    insert into public.workshop_registrations (workshop_id, name, email, phone, participants, extra_participants, wants_materials, message, status, ip_hash)
    values (null, p_name, p_email, p_phone, p_participants, coalesce(p_extra_participants, '[]'::jsonb), p_wants_materials, p_message, 'waitlist', p_ip_hash)
    returning id into new_id;
    return query select new_id, 'waitlist'::text, 0;
    return;
  end if;

  select * into w from public.workshops where id = p_workshop_id for update;
  if not found or w.status = 'draft' then
    raise exception 'workshop_not_found';
  end if;

  left_now := w.capacity - public.workshop_seats_taken(w.id);

  if w.status = 'closed' or w.starts_at < now() or left_now < p_participants then
    new_status := 'waitlist';
  else
    new_status := 'pending';
  end if;

  insert into public.workshop_registrations (workshop_id, name, email, phone, participants, extra_participants, wants_materials, message, status, ip_hash)
  values (w.id, p_name, p_email, p_phone, p_participants, coalesce(p_extra_participants, '[]'::jsonb), p_wants_materials, p_message, new_status, p_ip_hash)
  returning id into new_id;

  return query select new_id, new_status,
    greatest(w.capacity - public.workshop_seats_taken(w.id), 0);
end;
$$;

-- Registreerida saab ainult serveri kaudu (spämmikaitse), mitte otse anon-võtmega
revoke all on function public.register_for_workshop(uuid, text, text, text, int, boolean, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.register_for_workshop(uuid, text, text, text, int, boolean, text, text, jsonb) to service_role;
grant execute on function public.workshop_seats_taken(uuid) to anon, authenticated;
grant select on public.workshops_public to anon, authenticated;
grant select on public.workshops, public.workshop_gallery to anon;
grant select, insert, update, delete on public.workshops, public.workshop_registrations, public.workshop_gallery to authenticated;
grant all on public.workshops, public.workshop_registrations, public.workshop_gallery to service_role;

-- ---------------------------------------------------------------------------
-- Turvareeglid (RLS): avalikkus näeb õpitube ja galeriid, sisseloginud haldur kõike
-- ---------------------------------------------------------------------------
alter table public.workshops enable row level security;
alter table public.workshop_registrations enable row level security;
alter table public.workshop_gallery enable row level security;

drop policy if exists "workshops public read" on public.workshops;
create policy "workshops public read" on public.workshops
  for select to anon using (status <> 'draft');

drop policy if exists "workshops admin all" on public.workshops;
create policy "workshops admin all" on public.workshops
  for all to authenticated using (true) with check (true);

drop policy if exists "registrations admin all" on public.workshop_registrations;
create policy "registrations admin all" on public.workshop_registrations
  for all to authenticated using (true) with check (true);

drop policy if exists "gallery public read" on public.workshop_gallery;
create policy "gallery public read" on public.workshop_gallery
  for select to anon, authenticated using (true);

drop policy if exists "gallery admin write" on public.workshop_gallery;
create policy "gallery admin write" on public.workshop_gallery
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Pildipank õpitubade piltidele
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('workshop-photos', 'workshop-photos', true)
on conflict (id) do nothing;

drop policy if exists "workshop photos public read" on storage.objects;
create policy "workshop photos public read" on storage.objects
  for select using (bucket_id = 'workshop-photos');

drop policy if exists "workshop photos admin insert" on storage.objects;
create policy "workshop photos admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'workshop-photos');

drop policy if exists "workshop photos admin delete" on storage.objects;
create policy "workshop photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'workshop-photos');

-- ---------------------------------------------------------------------------
-- Esimene õpituba: 7 kohta, 2 juba broneeritud -> vabu 5
-- ---------------------------------------------------------------------------
insert into public.workshops (title, description, starts_at, duration_text, location, price_eur, payment_note, includes, extras, capacity, reserved_offline, image_url, status)
select
  'Tapikangaspuu õpituba',
  'Tule ja koo endale tapikangaspuul pehme villavaip! Juhendame samm-sammult, eelteadmisi pole vaja. Kohtade täitumisel teeme teise õpitoa detsembri alguses.',
  '2026-11-28 12:00:00+02',
  '',
  'Lepiku talu, Lõu küla, Saaremaa',
  30,
  'Maksmine kohapeal',
  E'Õpetus ja juhendamine\nTee ja kohv\n40 × 90 cm villavaip, mille oled ise teinud',
  'Tapikangaspuid ja villavorsti saab soovi korral ka eraldi juurde osta.',
  7,
  2,
  '/opitoad/tapikangaspuu.webp',
  'published'
where not exists (select 1 from public.workshops where title = 'Tapikangaspuu õpituba' and starts_at = '2026-11-28 12:00:00+02');
