-- Run in Supabase SQL Editor (after setup.sql)
-- Online CSF / training evaluation forms with public share links

create table if not exists public.feedback_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  training_title text not null,
  venue text not null default '',
  training_date date not null,
  welcome_message text not null default '',
  is_published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.evaluations
  add column if not exists feedback_form_id uuid references public.feedback_forms (id) on delete set null;

create index if not exists feedback_forms_slug_idx on public.feedback_forms (slug);
create index if not exists evaluations_feedback_form_id_idx on public.evaluations (feedback_form_id);

drop trigger if exists feedback_forms_set_updated_at on public.feedback_forms;
create trigger feedback_forms_set_updated_at
before update on public.feedback_forms
for each row execute function public.set_updated_at();

alter table public.feedback_forms enable row level security;

drop policy if exists feedback_forms_authenticated on public.feedback_forms;
create policy feedback_forms_authenticated on public.feedback_forms
  for all to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

grant select, insert, update, delete on public.feedback_forms to authenticated;

-- Public read (published forms only) — no direct table access for anon
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
    'training_title', f.training_title,
    'venue', f.venue,
    'training_date', f.training_date,
    'welcome_message', f.welcome_message
  )
  into result
  from public.feedback_forms f
  where f.slug = form_slug and f.is_published = true;

  return result;
end;
$$;

-- Public submit — inserts evaluation linked to form
create or replace function public.submit_public_feedback(form_slug text, payload jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  form_row public.feedback_forms%rowtype;
  batch_id uuid;
  new_id uuid;
begin
  select * into form_row
  from public.feedback_forms
  where slug = form_slug and is_published = true;

  if form_row.id is null then
    raise exception 'Form not found or not published';
  end if;

  insert into public.import_batches (source, file_name, row_count, notes)
  values ('manual', form_slug, 1, 'Online evaluation form submission')
  returning id into batch_id;

  insert into public.evaluations (
    feedback_form_id,
    import_batch_id,
    submitted_at,
    evaluator_name,
    contact_number,
    training_title,
    venue,
    training_date,
    relevance_content_job,
    relevance_topics_needs,
    materials_organization,
    examples_practical,
    knowledge_expertise,
    responded_queries,
    evidence_based,
    theory_practical,
    presentation_clear,
    visual_aids,
    pacing_timing,
    encouraged_participation,
    confidence_feedback,
    courtesy_professionalism,
    rapport_participants,
    gained_knowledge,
    apply_learning,
    competence_improved,
    inspired_learning,
    venue_conducive,
    av_equipment,
    schedule_pacing,
    meals_refreshments,
    support_staff,
    overall_satisfaction,
    recommend_likelihood,
    areas_for_improvement,
    future_suggestions
  ) values (
    form_row.id,
    batch_id,
    timezone('utc', now()),
    coalesce(payload ->> 'evaluator_name', ''),
    coalesce(payload ->> 'contact_number', ''),
    form_row.training_title,
    coalesce(nullif(payload ->> 'venue', ''), form_row.venue, ''),
    coalesce((payload ->> 'training_date')::date, form_row.training_date),
    (payload ->> 'relevance_content_job')::smallint,
    (payload ->> 'relevance_topics_needs')::smallint,
    (payload ->> 'materials_organization')::smallint,
    (payload ->> 'examples_practical')::smallint,
    (payload ->> 'knowledge_expertise')::smallint,
    (payload ->> 'responded_queries')::smallint,
    (payload ->> 'evidence_based')::smallint,
    (payload ->> 'theory_practical')::smallint,
    (payload ->> 'presentation_clear')::smallint,
    (payload ->> 'visual_aids')::smallint,
    (payload ->> 'pacing_timing')::smallint,
    (payload ->> 'encouraged_participation')::smallint,
    (payload ->> 'confidence_feedback')::smallint,
    (payload ->> 'courtesy_professionalism')::smallint,
    (payload ->> 'rapport_participants')::smallint,
    (payload ->> 'gained_knowledge')::smallint,
    (payload ->> 'apply_learning')::smallint,
    (payload ->> 'competence_improved')::smallint,
    (payload ->> 'inspired_learning')::smallint,
    (payload ->> 'venue_conducive')::smallint,
    (payload ->> 'av_equipment')::smallint,
    (payload ->> 'schedule_pacing')::smallint,
    nullif(payload ->> 'meals_refreshments', '')::smallint,
    (payload ->> 'support_staff')::smallint,
    (payload ->> 'overall_satisfaction')::smallint,
    (payload ->> 'recommend_likelihood')::smallint,
    coalesce(payload ->> 'areas_for_improvement', ''),
    coalesce(payload ->> 'future_suggestions', '')
  )
  returning id into new_id;

  return json_build_object('id', new_id);
end;
$$;

grant execute on function public.get_public_feedback_form(text) to anon, authenticated;
grant execute on function public.submit_public_feedback(text, jsonb) to anon, authenticated;
