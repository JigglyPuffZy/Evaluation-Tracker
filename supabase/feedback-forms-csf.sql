-- Run AFTER feedback-forms.sql — adds DOST CSF template support (QMS 06-F03 style)

alter table public.feedback_forms
  add column if not exists form_type text not null default 'training_evaluation'
    check (form_type in ('training_evaluation', 'csf'));

alter table public.feedback_forms
  add column if not exists section_config jsonb not null default '{}'::jsonb;

alter table public.feedback_forms
  add column if not exists show_on_dashboard boolean not null default false;

create table if not exists public.csf_responses (
  id uuid primary key default gen_random_uuid(),
  feedback_form_id uuid not null references public.feedback_forms (id) on delete cascade,
  submitted_at timestamptz not null default timezone('utc', now()),
  response jsonb not null
);

create index if not exists csf_responses_form_id_idx on public.csf_responses (feedback_form_id);

alter table public.csf_responses enable row level security;

drop policy if exists csf_responses_authenticated on public.csf_responses;
create policy csf_responses_authenticated on public.csf_responses
  for select to authenticated
  using (public.is_active_user());

grant select on public.csf_responses to authenticated;

create or replace function public.get_public_feedback_form(form_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'id', f.id,
    'slug', f.slug,
    'form_type', f.form_type,
    'training_title', f.training_title,
    'venue', f.venue,
    'training_date', f.training_date,
    'welcome_message', f.welcome_message,
    'section_config', f.section_config
  )
  into result
  from public.feedback_forms f
  where f.slug = form_slug and f.is_published = true;

  return result;
end;
$$;

create or replace function public.submit_public_csf(form_slug text, payload jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  form_row public.feedback_forms%rowtype;
  new_id uuid;
begin
  select * into form_row
  from public.feedback_forms
  where slug = form_slug and is_published = true and form_type = 'csf';

  if form_row.id is null then
    raise exception 'CSF form not found or not published';
  end if;

  insert into public.csf_responses (feedback_form_id, response)
  values (form_row.id, payload)
  returning id into new_id;

  return json_build_object('id', new_id);
end;
$$;

grant execute on function public.submit_public_csf(text, jsonb) to anon, authenticated;
