-- =============================================================================
-- DOST RO2 Evaluation Tracker — FULL SETUP (run once in Supabase SQL Editor)
-- Project: fatvwpnqoexvdneevgof
--
-- Steps:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this ENTIRE file → Run
--   3. Authentication → Users → Add user (email + password)
--   4. Sign in on the app
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RESET (drops old objects so re-run works)
-- ---------------------------------------------------------------------------
drop trigger if exists evaluations_sync_training on public.evaluations;
drop trigger if exists evaluations_set_updated_at on public.evaluations;
drop trigger if exists trainings_set_updated_at on public.trainings;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.training_stats;
drop view if exists public.evaluation_summary;

drop table if exists public.evaluations cascade;
drop table if exists public.import_batches cascade;
drop table if exists public.trainings cascade;
drop table if exists public.profiles cascade;

drop type if exists public.import_source cascade;
drop type if exists public.app_role cascade;

drop function if exists public.sync_evaluation_training() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_active_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.normalize_training_title(text) cascade;
drop function if exists public.excel_serial_to_date(numeric) cascade;

-- ---------------------------------------------------------------------------
-- HELPERS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_training_title(raw_title text)
returns text language sql immutable as $$
  select lower(trim(regexp_replace(regexp_replace(coalesce(raw_title, ''), '\s+', ' ', 'g'), '[^\w\s\-()/]', '', 'g')));
$$;

-- ---------------------------------------------------------------------------
-- PROFILES (linked to Supabase Auth)
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('staff', 'trainer', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'staff',
  office text default 'DOST Regional Office No. 02',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- TRAININGS
-- ---------------------------------------------------------------------------
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_normalized text not null,
  venue text,
  training_date date not null,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trainings_title_date_unique unique (title_normalized, training_date)
);

create index trainings_training_date_idx on public.trainings (training_date desc);
create trigger trainings_set_updated_at
before update on public.trainings for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- IMPORT BATCHES
-- ---------------------------------------------------------------------------
create type public.import_source as enum ('google_form', 'csv', 'excel', 'manual');

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source public.import_source not null default 'csv',
  file_name text,
  row_count integer not null default 0,
  imported_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- EVALUATIONS (matches React app columns)
-- ---------------------------------------------------------------------------
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.trainings (id) on delete set null,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  submitted_at timestamptz,
  evaluator_name text not null default '',
  contact_number text not null default '',
  training_title text not null,
  venue text not null default '',
  training_date date not null,
  relevance_content_job smallint not null,
  relevance_topics_needs smallint not null,
  materials_organization smallint not null,
  examples_practical smallint not null,
  knowledge_expertise smallint not null,
  responded_queries smallint not null,
  evidence_based smallint not null,
  theory_practical smallint not null,
  presentation_clear smallint not null,
  visual_aids smallint not null,
  pacing_timing smallint not null,
  encouraged_participation smallint not null,
  confidence_feedback smallint not null,
  courtesy_professionalism smallint not null,
  rapport_participants smallint not null,
  gained_knowledge smallint not null,
  apply_learning smallint not null,
  competence_improved smallint not null,
  inspired_learning smallint not null,
  venue_conducive smallint not null,
  av_equipment smallint not null,
  schedule_pacing smallint not null,
  meals_refreshments smallint,
  support_staff smallint not null,
  overall_satisfaction smallint not null,
  recommend_likelihood smallint not null,
  areas_for_improvement text not null default '',
  future_suggestions text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint evaluations_rating_range check (
    relevance_content_job between 1 and 4 and relevance_topics_needs between 1 and 4
    and materials_organization between 1 and 4 and examples_practical between 1 and 4
    and knowledge_expertise between 1 and 4 and responded_queries between 1 and 4
    and evidence_based between 1 and 4 and theory_practical between 1 and 4
    and presentation_clear between 1 and 4 and visual_aids between 1 and 4
    and pacing_timing between 1 and 4 and encouraged_participation between 1 and 4
    and confidence_feedback between 1 and 4 and courtesy_professionalism between 1 and 4
    and rapport_participants between 1 and 4 and gained_knowledge between 1 and 4
    and apply_learning between 1 and 4 and competence_improved between 1 and 4
    and inspired_learning between 1 and 4 and venue_conducive between 1 and 4
    and av_equipment between 1 and 4 and schedule_pacing between 1 and 4
    and (meals_refreshments is null or meals_refreshments between 1 and 4)
    and support_staff between 1 and 4 and overall_satisfaction between 1 and 4
    and recommend_likelihood between 1 and 4
  )
);

create index evaluations_training_id_idx on public.evaluations (training_id);
create index evaluations_training_date_idx on public.evaluations (training_date desc);

create trigger evaluations_set_updated_at
before update on public.evaluations for each row execute function public.set_updated_at();

-- Auto-link training row (bypasses RLS)
create or replace function public.sync_evaluation_training()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  training_uuid uuid;
begin
  normalized := public.normalize_training_title(new.training_title);
  insert into public.trainings (title, title_normalized, venue, training_date)
  values (new.training_title, normalized, nullif(new.venue, ''), new.training_date)
  on conflict (title_normalized, training_date) do update set
    title = excluded.title,
    venue = coalesce(nullif(excluded.venue, ''), public.trainings.venue),
    updated_at = timezone('utc', now())
  returning id into training_uuid;
  new.training_id := training_uuid;
  return new;
end;
$$;

create trigger evaluations_sync_training
before insert or update of training_title, training_date, venue on public.evaluations
for each row execute function public.sync_evaluation_training();

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------
create or replace view public.evaluation_summary as
select
  e.id, e.training_id, e.training_title, e.training_date, e.venue,
  e.evaluator_name, e.submitted_at,
  round((
    relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
    + knowledge_expertise + responded_queries + evidence_based + theory_practical
    + presentation_clear + visual_aids + pacing_timing + encouraged_participation
    + confidence_feedback + courtesy_professionalism + rapport_participants
    + gained_knowledge + apply_learning + competence_improved + inspired_learning
    + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 0)
    + support_staff + overall_satisfaction + recommend_likelihood
  )::numeric / 25.0, 2) as overall_average,
  round((
    relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
    + knowledge_expertise + responded_queries + evidence_based + theory_practical
    + presentation_clear + visual_aids + pacing_timing + encouraged_participation
    + confidence_feedback + courtesy_professionalism + rapport_participants
    + gained_knowledge + apply_learning + competence_improved + inspired_learning
    + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 0)
    + support_staff + overall_satisfaction + recommend_likelihood
  )::numeric / 25.0 / 4.0 * 100, 0) as overall_percent
from public.evaluations e;

create or replace view public.training_stats as
select
  t.id as training_id, t.title, t.training_date, t.venue,
  count(e.id) as response_count,
  round(avg(s.overall_average), 2) as average_score,
  round(avg(s.overall_percent), 0) as average_percent
from public.trainings t
left join public.evaluations e on e.training_id = t.id
left join public.evaluation_summary s on s.id = e.id
group by t.id, t.title, t.training_date, t.venue;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (fixed — no infinite recursion)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trainings enable row level security;
alter table public.import_batches enable row level security;
alter table public.evaluations enable row level security;

-- Profiles
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Data tables: any signed-in active user
create policy "trainings_select" on public.trainings
  for select to authenticated using (public.is_active_user());

create policy "trainings_write" on public.trainings
  for all to authenticated using (public.is_active_user()) with check (public.is_active_user());

create policy "evaluations_select" on public.evaluations
  for select to authenticated using (public.is_active_user());

create policy "evaluations_write" on public.evaluations
  for all to authenticated using (public.is_active_user()) with check (public.is_active_user());

create policy "import_batches_select" on public.import_batches
  for select to authenticated using (public.is_active_user());

create policy "import_batches_write" on public.import_batches
  for all to authenticated using (public.is_active_user()) with check (public.is_active_user());

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.trainings to authenticated;
grant select, insert, update, delete on public.evaluations to authenticated;
grant select, insert, update, delete on public.import_batches to authenticated;
grant select on public.evaluation_summary to authenticated;
grant select on public.training_stats to authenticated;

-- Backfill profiles for users created BEFORE this script
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'staff'
from auth.users u
on conflict (id) do update set role = 'staff', is_active = true;

-- ---------------------------------------------------------------------------
-- SEED DATA — 23 rows from your Google Form Excel export
-- ---------------------------------------------------------------------------
insert into public.import_batches (source, file_name, row_count, notes)
values ('excel', 'Training Evaluation Form (Responses).xlsx', 23, 'Google Form export');

insert into public.evaluations (
  submitted_at, evaluator_name, contact_number, training_title, venue, training_date,
  relevance_content_job, relevance_topics_needs, materials_organization, examples_practical,
  knowledge_expertise, responded_queries, evidence_based, theory_practical,
  presentation_clear, visual_aids, pacing_timing, encouraged_participation,
  confidence_feedback, courtesy_professionalism, rapport_participants,
  gained_knowledge, apply_learning, competence_improved, inspired_learning,
  venue_conducive, av_equipment, schedule_pacing, meals_refreshments, support_staff,
  overall_satisfaction, recommend_likelihood, areas_for_improvement, future_suggestions
) values
  (timezone('utc', timestamp '2026-04-14 16:08:44'), 'Angelo V. Capurian', '09288372445', 'Onboarding Orientation', 'Zoom', '2026-04-14', 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-14 16:18:31'), '', '', '2026 Conduct of On-Boarding', 'Online platform', '2026-04-14', 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 3, null, 4, 3, 3, '-', '-'),
  (timezone('utc', timestamp '2026-04-14 16:21:52'), 'Marco Antonio L. Conseja', '09159148641', '2026 Conduct of Onboarding', 'DOST II - Conference Room & via zoom', '2026-04-14', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, '~', '~'),
  (timezone('utc', timestamp '2026-04-14 18:30:27'), '', '0955-039-1148', 'Onboarding', 'Zoom', '2026-04-14', 4, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3, 3, 3, 4, 3, 4, 4, 3, 4, 3, 3, 2, null, 3, 3, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-15 14:22:22'), '', '0956 9964714', 'Onboarding', 'Zoom', '2026-04-14', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-15 15:34:25'), 'Duane Carodan', '09619113305', 'Onboarding', 'Online', '2026-04-14', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, ' ', ' '),
  (timezone('utc', timestamp '2026-04-21 15:20:43'), 'Jonalyn S. Lagmay', '09753711834', 'smart and sustainable community program (SSCP) roadmapping workshop', 'Mayo''s Office, San Fabian, Echague, Isabela', '2026-04-21', 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, null, 4, 4, 3, 'more trainings ', 'System generation'),
  (timezone('utc', timestamp '2026-04-21 15:22:08'), 'KYRVIE ELISHA L BAGUION ', '+639926712954', 'SSCP Roadmapping Workshop ', 'Mengal, LGU Echague ', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:22:40'), 'JEROME NAZAR C. PANGANIBAN', '09171678077', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM ROADMAPPING WORKSHOP', 'MAYORS OFFICE FUNCTION HALL', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:23:08'), 'Lylandro E. Velo', '09950961734', 'SMART AND sustainable community Program (SSCP) Roadmapping Workshop', 'MAYOR''S OFFCE NEW BLDG. - San Fabian, Echague, Isabela', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/A', 'N/A'),
  (timezone('utc', timestamp '2026-04-21 15:23:26'), 'Shara Mae D. Sabbaluca', '09174652010', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM (SSCP) ROADMAPPING WORKSHOP ', 'Function Hall, Mayor''s Office, LGU Echague', '2026-04-20', 4, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 4, 4, 3, null, 4, 4, 4, 'None', 'Internal data system'),
  (timezone('utc', timestamp '2026-04-21 15:23:35'), 'Melissa G. Corpuz', '09178886930', 'Smart and sustainable community program (sscp) roadmapping  workshop', 'New mayor''s office, echague. Isabela', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, '.', '.'),
  (timezone('utc', timestamp '2026-04-21 15:23:39'), 'Jennie S. Quidawen', '09338653506', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'New Mayor''s Office Function Hall', '2026-04-21', 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 3, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:23:50'), 'Gretchen S. Abuena, MD.', '09178687619', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor''s Office function Hall', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:23:50'), 'ERIC M. BUGARIN', '09652242435', 'SAMRT AND SUSTAINABLE COMMUNITY PROGRAM(SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'good', 'none'),
  (timezone('utc', timestamp '2026-04-21 15:23:54'), 'Jacqueline A. Casco-Buduan', '09175741710', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM(SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office Function Hall', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'NA', 'NA'),
  (timezone('utc', timestamp '2026-04-21 15:24:20'), 'NEM G. CASTILLO', '09998698900', 'Sscp', 'Echague', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'Na', 'Na'),
  (timezone('utc', timestamp '2026-04-21 15:27:35'), 'MARYANN R. SARANDI', '0910-323-7712', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM (SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office Function Hall', '2026-04-21', 4, 3, 3, 3, 4, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:28:23'), 'Dawn Louella C. Panaligan', '09691845108', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'San Fabian, Echague Isabela', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/a', 'N/a'),
  (timezone('utc', timestamp '2026-04-21 15:30:27'), 'Janice D. Laman', '09552573377', 'smart and sustainable community program (SSCP) ROADMAPPING WORKSHOP', 'SAN FABIAN ECHAGUE ISABELA', '2026-04-21', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, null, 1, 1, 1, 'N/A', 'N/A'),
  (timezone('utc', timestamp '2026-04-21 15:32:07'), '', '09212751304', 'SSCP Roadmapping Workshop', 'Mayor''s Office, San Fabian, Echague, Isabela', '2026-04-20', 3, 3, 3, 3, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 3, 'SSCP could be broader, dates could''ve been adjusted to accommodate more topics', 'Expound on SSCP before narrowing it down to the target'),
  (timezone('utc', timestamp '2026-04-21 15:35:41'), 'Roy Angelo Gaffud', '09669539052', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor''s Office LGU Echague Isabela', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/A', 'N/A'),
  (timezone('utc', timestamp '2026-04-21 15:37:55'), 'Roy Angelo Gaffud', '09669539052', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor''s Office LGU Echague', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/A', 'N/A');

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
select count(*) as evaluation_count from public.evaluations;
select count(*) as training_count from public.trainings;
select * from public.training_stats order by response_count desc limit 10;
