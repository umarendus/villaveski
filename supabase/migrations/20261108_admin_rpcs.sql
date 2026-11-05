-- Halduri toimingud ühe tehinguna, õpitoa rea lukuga (sama lukk mis register_for_workshop'il),
-- et samaaegne registreerimine ei saaks viimast kohta topelt hõivata.

-- Registreeringu staatuse muutmine / teisele õpitoale tõstmine. Kutsub ainult server (service_role),
-- kes on enne halduri õiguse kontrollinud.
create or replace function public.admin_change_registration(
  p_id uuid,
  p_status text,
  p_move boolean default false,
  p_workshop_id uuid default null,
  p_force boolean default false
)
returns public.workshop_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  cur public.workshop_registrations%rowtype;
  w public.workshops%rowtype;
  target uuid;
  holds_new boolean;
  starts_holding boolean;
  left_now int;
  result public.workshop_registrations%rowtype;
begin
  if p_status not in ('pending', 'confirmed', 'cancelled', 'waitlist') then
    raise exception 'invalid_status';
  end if;

  select * into cur from public.workshop_registrations where id = p_id for update;
  if not found then
    raise exception 'registration_not_found';
  end if;

  target := case when p_move then p_workshop_id else cur.workshop_id end;
  holds_new := p_status in ('pending', 'confirmed');

  if holds_new and target is null then
    raise exception 'no_workshop';
  end if;

  starts_holding := holds_new
    and (cur.status not in ('pending', 'confirmed') or target is distinct from cur.workshop_id);

  if target is not null and (p_move or starts_holding) then
    select * into w from public.workshops where id = target for update;
    if not found then
      raise exception 'workshop_not_found';
    end if;
    if starts_holding and (w.status = 'draft' or w.starts_at < now()) then
      raise exception 'workshop_unavailable';
    end if;
  end if;

  if starts_holding and not p_force then
    left_now := w.capacity - public.workshop_seats_taken(w.id);
    if left_now < cur.participants then
      raise exception 'no_seats:%', greatest(left_now, 0);
    end if;
  end if;

  update public.workshop_registrations
  set status = p_status,
      workshop_id = target,
      confirmed_at = case
        when p_status = 'confirmed' then coalesce(case when cur.status = 'confirmed' then cur.confirmed_at end, now())
        else null
      end
  where id = p_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.admin_change_registration(uuid, text, boolean, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_change_registration(uuid, text, boolean, uuid, boolean) to service_role;

-- Õpitoa kustutamine: ootel/kinnitatud registreeringud liiguvad huviliste nimekirja ja õpituba
-- kustutatakse samas tehingus. Tagastab huvilisteks tõstetud registreeringute arvu.
create or replace function public.admin_delete_workshop(p_workshop_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  moved int;
begin
  if not public.is_workshop_admin() then
    raise exception 'forbidden';
  end if;

  perform 1 from public.workshops where id = p_workshop_id for update;
  if not found then
    raise exception 'workshop_not_found';
  end if;

  update public.workshop_registrations
  set status = 'waitlist', confirmed_at = null
  where workshop_id = p_workshop_id and status in ('pending', 'confirmed');
  get diagnostics moved = row_count;

  delete from public.workshops where id = p_workshop_id;
  return moved;
end;
$$;

revoke all on function public.admin_delete_workshop(uuid) from public, anon;
grant execute on function public.admin_delete_workshop(uuid) to authenticated, service_role;
