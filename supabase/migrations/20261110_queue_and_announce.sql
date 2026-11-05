-- Ootel (broneeritud, kinnitamata) kohtade arv avalikul lehel ning huviliste teavitamise märge.

-- Avalik vaade: lisaks vabadele kohtadele ootel registreeringute inimeste arv (ilma isikuandmeteta)
create or replace view public.workshops_public
with (security_invoker = false) as
select
  w.id, w.title, w.description, w.starts_at, w.duration_text, w.location,
  w.price_eur, w.payment_note, w.includes, w.extras, w.capacity, w.image_url, w.status,
  greatest(w.capacity - public.workshop_seats_taken(w.id), 0) as seats_left,
  coalesce((
    select sum(r.participants)::int
    from public.workshop_registrations r
    where r.workshop_id = w.id and r.status = 'pending'
  ), 0) as pending_people
from public.workshops w
where w.status <> 'draft';

grant select on public.workshops_public to anon, authenticated;

-- Millal ja mitmele huvilisele uuest õpitoast teada anti
alter table public.workshops add column if not exists announced_at timestamptz;
alter table public.workshops add column if not exists announced_count int not null default 0;
