-- E-kirjade mallide tekstid, mida haldur saab muuta. Puuduv rida = koodis olev vaikimisi tekst.
-- Salvestamine käib serveri kaudu (/api/opitoad/mallid), mis kontrollib kohustuslikke muutujaid.

create table if not exists public.email_templates (
  key text primary key,
  subject text not null,
  preheader text not null default '',
  heading text not null,
  intro text not null default '',
  button_label text not null,
  outro text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.email_templates enable row level security;

revoke all on public.email_templates from anon;
grant select on public.email_templates to authenticated;
grant all on public.email_templates to service_role;

drop policy if exists "email templates admin read" on public.email_templates;
create policy "email templates admin read" on public.email_templates
  for select to authenticated using (public.is_workshop_admin());
