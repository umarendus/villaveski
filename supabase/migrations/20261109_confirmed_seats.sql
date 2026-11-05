-- Kohad vähenevad alles halduri kinnitusega: ootel registreering kohta ei hõiva.
-- register_for_workshop ja workshops_public kasutavad workshop_seats_taken'it, seega muutuvad automaatselt.

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
    where r.workshop_id = w_id and r.status = 'confirmed'
  ), 0)
  from public.workshops w
  where w.id = w_id;
$$;

-- Kohtade kontroll ainult siis, kui registreering muutub kinnitatuks (või kinnitatu tõstetakse teisele õpitoale)
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
  becomes_active boolean;
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

  -- ootel või kinnitatud registreering peab kuuluma mõnele õpitoale
  if p_status in ('pending', 'confirmed') and target is null then
    raise exception 'no_workshop';
  end if;

  becomes_active := p_status in ('pending', 'confirmed')
    and (cur.status not in ('pending', 'confirmed') or target is distinct from cur.workshop_id);
  starts_holding := p_status = 'confirmed'
    and (cur.status <> 'confirmed' or target is distinct from cur.workshop_id);

  if target is not null and (p_move or becomes_active or starts_holding) then
    select * into w from public.workshops where id = target for update;
    if not found then
      raise exception 'workshop_not_found';
    end if;
    if (becomes_active or starts_holding) and (w.status = 'draft' or w.starts_at < now()) then
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
