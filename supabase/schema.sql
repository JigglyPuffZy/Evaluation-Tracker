-- =============================================================================
-- ⚠️  DO NOT RUN THIS FILE — use supabase/setup.sql instead
--     setup.sql has fixed RLS, triggers, grants, profile backfill, and seed data.
-- =============================================================================
-- DOST RO2 — Training Evaluation Analytics
-- Supabase PostgreSQL schema (reference only)
--
-- Backend stack:
--   • Database : Supabase (PostgreSQL)
--   • Auth     : Supabase Auth (email + password)
--   • API      : Supabase client (@supabase/supabase-js) + Row Level Security
--   • Storage  : (optional) supabase.storage for CSV / Excel uploads
--
-- Source form columns (Google Form / Excel export — 33 columns, 23 responses):
--   Timestamp, Name, Contact Number, Training Title, Venue, Date/s,
--   25 rating questions (1–4 scale), 2 comment fields
--   Note: Google Form does NOT include "Meals and refreshments" — column is nullable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions & helpers
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Normalize training titles for grouping (handles SSCP spelling variants, etc.)
create or replace function public.normalize_training_title(raw_title text)
returns text
language sql
immutable
as $$
  select lower(
    trim(
      regexp_replace(
        regexp_replace(coalesce(raw_title, ''), '\s+', ' ', 'g'),
        '[^\w\s\-()/]',
        '',
        'g'
      )
    )
  );
$$;

-- Convert Google Sheets / Excel serial date to DATE (optional for imports)
create or replace function public.excel_serial_to_date(serial numeric)
returns date
language plpgsql
immutable
as $$
begin
  if serial is null or serial = 0 then
    return null;
  end if;
  return date '1899-12-30' + floor(serial)::integer;
exception
  when others then
    return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Roles & profiles (extends Supabase Auth)
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
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Trainings (grouped programs — title + date)
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
create index trainings_title_normalized_idx on public.trainings (title_normalized);

create trigger trainings_set_updated_at
before update on public.trainings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Import batches (CSV / Google Form export tracking)
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
-- 4. Evaluations (one row = one form response)
--    Column names match the React app (evaluation.ts / parseEvaluationCsv.ts)
-- ---------------------------------------------------------------------------
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),

  training_id uuid references public.trainings (id) on delete set null,
  import_batch_id uuid references public.import_batches (id) on delete set null,

  -- Metadata (Google Form columns 1–6)
  submitted_at timestamptz,
  evaluator_name text not null default '',
  contact_number text not null default '',
  training_title text not null,
  venue text not null default '',
  training_date date not null,

  -- Part I — Training Content and Delivery
  relevance_content_job smallint not null,
  relevance_topics_needs smallint not null,
  materials_organization smallint not null,
  examples_practical smallint not null,

  -- Part II — Resource Speakers
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

  -- Part III — Learning Outcomes
  gained_knowledge smallint not null,
  apply_learning smallint not null,
  competence_improved smallint not null,
  inspired_learning smallint not null,

  -- Part IV — Environment & Logistics
  venue_conducive smallint not null,
  av_equipment smallint not null,
  schedule_pacing smallint not null,
  meals_refreshments smallint, -- nullable: not in Google Form export
  support_staff smallint not null,

  -- Part V — Overall
  overall_satisfaction smallint not null,
  recommend_likelihood smallint not null,

  -- Part VI — Comments
  areas_for_improvement text not null default '',
  future_suggestions text not null default '',

  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint evaluations_rating_range check (
    relevance_content_job between 1 and 4
    and relevance_topics_needs between 1 and 4
    and materials_organization between 1 and 4
    and examples_practical between 1 and 4
    and knowledge_expertise between 1 and 4
    and responded_queries between 1 and 4
    and evidence_based between 1 and 4
    and theory_practical between 1 and 4
    and presentation_clear between 1 and 4
    and visual_aids between 1 and 4
    and pacing_timing between 1 and 4
    and encouraged_participation between 1 and 4
    and confidence_feedback between 1 and 4
    and courtesy_professionalism between 1 and 4
    and rapport_participants between 1 and 4
    and gained_knowledge between 1 and 4
    and apply_learning between 1 and 4
    and competence_improved between 1 and 4
    and inspired_learning between 1 and 4
    and venue_conducive between 1 and 4
    and av_equipment between 1 and 4
    and schedule_pacing between 1 and 4
    and (meals_refreshments is null or meals_refreshments between 1 and 4)
    and support_staff between 1 and 4
    and overall_satisfaction between 1 and 4
    and recommend_likelihood between 1 and 4
  )
);

create index evaluations_training_id_idx on public.evaluations (training_id);
create index evaluations_training_date_idx on public.evaluations (training_date desc);
create index evaluations_training_title_idx on public.evaluations (training_title);
create index evaluations_submitted_at_idx on public.evaluations (submitted_at desc);

create trigger evaluations_set_updated_at
before update on public.evaluations
for each row execute function public.set_updated_at();

-- Upsert training when inserting an evaluation
create or replace function public.sync_evaluation_training()
returns trigger
language plpgsql
as $$
declare
  normalized text;
  training_uuid uuid;
begin
  normalized := public.normalize_training_title(new.training_title);

  insert into public.trainings (title, title_normalized, venue, training_date)
  values (new.training_title, normalized, nullif(new.venue, ''), new.training_date)
  on conflict (title_normalized, training_date)
  do update set
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
-- 5. Analytics views (used by dashboard)
-- ---------------------------------------------------------------------------
create or replace view public.evaluation_summary as
select
  e.id,
  e.training_id,
  e.training_title,
  e.training_date,
  e.venue,
  e.evaluator_name,
  e.submitted_at,
  (
    relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
    + knowledge_expertise + responded_queries + evidence_based + theory_practical
    + presentation_clear + visual_aids + pacing_timing + encouraged_participation
    + confidence_feedback + courtesy_professionalism + rapport_participants
    + gained_knowledge + apply_learning + competence_improved + inspired_learning
    + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 0)
    + support_staff + overall_satisfaction + recommend_likelihood
  )::numeric as rating_sum,
  (
    25 + case when meals_refreshments is not null then 1 else 0 end
  ) as rating_count,
  round(
    (
      relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
      + knowledge_expertise + responded_queries + evidence_based + theory_practical
      + presentation_clear + visual_aids + pacing_timing + encouraged_participation
      + confidence_feedback + courtesy_professionalism + rapport_participants
      + gained_knowledge + apply_learning + competence_improved + inspired_learning
      + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 0)
      + support_staff + overall_satisfaction + recommend_likelihood
    )::numeric
    / (25 + case when meals_refreshments is not null then 1 else 0 end),
    2
  ) as overall_average,
  round(
    (
      (
        relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
        + knowledge_expertise + responded_queries + evidence_based + theory_practical
        + presentation_clear + visual_aids + pacing_timing + encouraged_participation
        + confidence_feedback + courtesy_professionalism + rapport_participants
        + gained_knowledge + apply_learning + competence_improved + inspired_learning
        + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 0)
        + support_staff + overall_satisfaction + recommend_likelihood
      )::numeric
      / (25 + case when meals_refreshments is not null then 1 else 0 end)
      / 4.0
    ) * 100,
    0
  ) as overall_percent
from public.evaluations e;

create or replace view public.training_stats as
select
  t.id as training_id,
  t.title,
  t.title_normalized,
  t.venue,
  t.training_date,
  count(e.id) as response_count,
  round(avg(s.overall_average), 2) as average_score,
  round(avg(s.overall_percent), 0) as average_percent
from public.trainings t
left join public.evaluations e on e.training_id = t.id
left join public.evaluation_summary s on s.id = e.id
group by t.id, t.title, t.title_normalized, t.venue, t.training_date;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trainings enable row level security;
alter table public.import_batches enable row level security;
alter table public.evaluations enable row level security;

-- Profiles: users read/update own row; staff read all
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_select_staff"
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('staff', 'trainer')
  )
);

-- Trainings & evaluations: authenticated users can read
create policy "trainings_select_authenticated"
on public.trainings for select
to authenticated
using (true);

create policy "evaluations_select_authenticated"
on public.evaluations for select
to authenticated
using (true);

create policy "import_batches_select_authenticated"
on public.import_batches for select
to authenticated
using (true);

-- Staff can insert/update evaluations and trainings
create policy "trainings_insert_staff"
on public.trainings for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

create policy "trainings_update_staff"
on public.trainings for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

create policy "evaluations_insert_staff"
on public.evaluations for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

create policy "evaluations_update_staff"
on public.evaluations for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

create policy "evaluations_delete_staff"
on public.evaluations for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

create policy "import_batches_insert_staff"
on public.import_batches for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active = true
  )
);

-- ---------------------------------------------------------------------------
-- 7. Google Form / Excel column mapping reference
-- ---------------------------------------------------------------------------
comment on table public.evaluations is
'Maps to Google Form export columns:
  Timestamp→submitted_at, Name→evaluator_name, Contact Number→contact_number,
  Training Title→training_title, Venue→venue, Date/s→training_date,
  Cols 7–31→rating fields (1–4), Cols 32–33→comment fields.
  meals_refreshments is NULL when imported from Google Form.';

-- ---------------------------------------------------------------------------
-- 8. SAMPLE INSERT (first row from your Excel file)
--    Run AFTER creating a user in Authentication → Users (copy their UUID)
-- ---------------------------------------------------------------------------

-- Step A: create import batch (replace USER_UUID)
/*
insert into public.import_batches (source, file_name, row_count, imported_by, notes)
values (
  'excel',
  'Training Evaluation Form (Responses).xlsx',
  23,
  'USER_UUID'::uuid,
  'Initial Google Form export'
)
returning id;
*/

-- Step B: insert one evaluation (replace BATCH_UUID; training_id auto-linked by trigger)
/*
insert into public.evaluations (
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
  'BATCH_UUID'::uuid,
  timezone('utc', timestamp '2026-04-03 16:08:45'), -- from Excel Timestamp serial
  'Angelo V. Capurian',
  '09288372445',
  'Onboarding Orientation',
  'Zoom',
  public.excel_serial_to_date(46126),
  4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 4,
  'None',
  'None'
);
*/

-- ---------------------------------------------------------------------------
-- 9. BULK INSERT helper — import all 23 rows via CSV in Supabase Table Editor
--     OR use this template after exporting Google Form → CSV with renamed headers:
-- ---------------------------------------------------------------------------
/*
Required CSV headers for direct import (rename Google Form columns):

evaluator_name,training_title,contact_number,venue,training_date,
relevance_content_job,relevance_topics_needs,materials_organization,examples_practical,
knowledge_expertise,responded_queries,evidence_based,theory_practical,
presentation_clear,visual_aids,pacing_timing,encouraged_participation,
confidence_feedback,courtesy_professionalism,rapport_participants,
gained_knowledge,apply_learning,competence_improved,inspired_learning,
venue_conducive,av_equipment,schedule_pacing,meals_refreshments,support_staff,
overall_satisfaction,recommend_likelihood,areas_for_improvement,future_suggestions

Google Form → app column rename cheat sheet:
  "Name"                          → evaluator_name
  "Training Title:"               → training_title
  "Date/s"                        → training_date  (YYYY-MM-DD)
  "Appropriateness of learning objectives..." → relevance_topics_needs
  "Integrated updated, evidence-based..."     → evidence_based
  "Demonstrated approachability..."           → confidence_feedback
  "I have gained new and relevant knowledge"  → gained_knowledge
  (meals_refreshments — leave empty / null)
*/

-- ---------------------------------------------------------------------------
-- 10. Useful verification queries (run after setup)
-- ---------------------------------------------------------------------------

-- List tables
-- select table_name from information_schema.tables where table_schema = 'public' order by 1;

-- Count evaluations per training
-- select * from public.training_stats order by training_date desc;

-- Dashboard totals
-- select count(*) as total_evaluations, count(distinct training_id) as trainings from public.evaluations;

-- Recent submissions
-- select evaluator_name, training_title, training_date, overall_average
-- from public.evaluation_summary order by submitted_at desc nulls last limit 20;
