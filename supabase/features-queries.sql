-- =============================================================================
-- DOST RO2 Evaluation Tracker — SQL for NEW APP FEATURES
-- Run in Supabase Dashboard → SQL Editor (one section at a time)
--
-- NO NEW MIGRATION NEEDED if you already ran setup.sql — these are helper queries.
-- Features covered:
--   • Role-based access (admin / staff / trainer / viewer)
--   • Import history & undo
--   • Duplicate row detection (import merge)
--   • Duplicate training title filter & merge
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. QUICK HEALTH CHECK
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.evaluations) as evaluations,
  (select count(*) from public.import_batches) as import_batches,
  (select count(*) from public.trainings) as trainings;


-- ---------------------------------------------------------------------------
-- 2. ROLES — set who can import, undo, clear data (app reads profiles.role)
-- ---------------------------------------------------------------------------

-- Make a user ADMIN (full access: import, undo, clear all)
update public.profiles
set role = 'admin', is_active = true
where email = 'jeffson@gmail.com';

-- Make a user STAFF (import, export, undo imports — no clear all)
update public.profiles
set role = 'staff', is_active = true
where email = 'someone@dost.gov.ph';

-- Make a user VIEWER (read-only dashboard — no import in app)
update public.profiles
set role = 'viewer', is_active = true
where email = 'viewer@dost.gov.ph';

-- List all users and roles
select id, email, full_name, role, is_active, created_at
from public.profiles
order by role, email;


-- ---------------------------------------------------------------------------
-- 3. IMPORT HISTORY (same data shown in app “Import history” panel)
-- ---------------------------------------------------------------------------
select
  b.id,
  b.file_name,
  b.source,
  b.row_count,
  b.notes,
  b.created_at,
  p.email as imported_by_email
from public.import_batches b
left join public.profiles p on p.id = b.imported_by
order by b.created_at desc
limit 30;

-- Rows linked to one import batch (replace UUID)
-- select * from public.evaluations where import_batch_id = 'YOUR-BATCH-UUID-HERE';


-- ---------------------------------------------------------------------------
-- 4. UNDO ONE IMPORT (manual — app “Undo” does the same)
-- Deletes evaluations from that batch, then the batch record.
-- ---------------------------------------------------------------------------
-- begin;
-- delete from public.evaluations where import_batch_id = 'YOUR-BATCH-UUID-HERE';
-- delete from public.import_batches where id = 'YOUR-BATCH-UUID-HERE';
-- commit;


-- ---------------------------------------------------------------------------
-- 5. DUPLICATE ROWS — same person + training + date + contact (import merge)
-- Matches app fingerprint logic for “Merge on import”
-- ---------------------------------------------------------------------------
with fingerprinted as (
  select
    id,
    evaluator_name,
    training_title,
    training_date,
    contact_number,
    import_batch_id,
    created_at,
    lower(trim(regexp_replace(coalesce(evaluator_name, ''), '\s+', ' ', 'g'))) as n_name,
    public.normalize_training_title(training_title) as n_title,
    trim(coalesce(training_date::text, '')) as n_date,
    lower(trim(regexp_replace(coalesce(contact_number, ''), '\s+', ' ', 'g'))) as n_contact
  from public.evaluations
)
select
  n_name,
  n_title,
  n_date,
  n_contact,
  count(*) as duplicate_count,
  array_agg(id order by created_at) as evaluation_ids,
  array_agg(distinct training_title) as title_variants
from fingerprinted
group by n_name, n_title, n_date, n_contact
having count(*) > 1
order by duplicate_count desc;


-- ---------------------------------------------------------------------------
-- 6. DUPLICATE TRAINING TITLES — spelling variants (Duplicates filter + merge)
-- Shows groups that look like the same program with different spellings
-- ---------------------------------------------------------------------------
select
  public.normalize_training_title(training_title) as normalized_key,
  count(distinct training_title) as title_variant_count,
  count(*) as response_count,
  array_agg(distinct training_title order by training_title) as title_variants
from public.evaluations
group by public.normalize_training_title(training_title)
having count(distinct training_title) > 1
order by title_variant_count desc, response_count desc;

-- All distinct raw titles with counts (for manual merge planning)
select
  training_title,
  count(*) as responses,
  min(training_date) as first_date,
  max(training_date) as last_date
from public.evaluations
group by training_title
order by responses desc, training_title;


-- ---------------------------------------------------------------------------
-- 7. MERGE TRAINING TITLES (manual — app “Merge duplicate training names” does this)
-- Renames all rows from old titles → one canonical title
-- ---------------------------------------------------------------------------
-- begin;
-- update public.evaluations
-- set training_title = 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop'
-- where training_title in (
--   'SSCP Roadmapping Workshop',
--   'SAMRT AND SUSTAINABLE COMMUNITY PROGRAM(SSCP) ROADMAPPING WORKSHOP',
--   'SMART AND SUSTAINABLE COMMUNITY PROGRAM ROADMAPPING WORKSHOP',
--   'Sscp'
-- );
-- commit;


-- ---------------------------------------------------------------------------
-- 8. MERGE ON IMPORT — find rows that WOULD update if you re-upload Excel
-- (existing row that matches incoming fingerprint)
-- Example: check one evaluator
-- ---------------------------------------------------------------------------
-- select *
-- from public.evaluations
-- where lower(trim(evaluator_name)) = lower(trim('Juan Dela Cruz'))
--   and public.normalize_training_title(training_title) = public.normalize_training_title('SSCP Workshop')
--   and training_date = '2026-04-21';


-- ---------------------------------------------------------------------------
-- 9. PASSWORD RESET — no SQL needed
-- Enable in Supabase: Authentication → Providers → Email
-- User clicks “Forgot password?” on login page
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 10. OPTIONAL: view training stats after merges
-- ---------------------------------------------------------------------------
select * from public.training_stats order by response_count desc nulls last;
select * from public.evaluation_summary order by training_date desc limit 20;


-- =============================================================================
-- 11. FEATURE VERIFICATION CHECKLIST (run after setup + app testing)
-- Copy results — each row should show status = OK (or EXPECTED for duplicates).
-- =============================================================================

-- 11a) One-shot pass/fail for core database objects
select
  (select count(*) from information_schema.tables
   where table_schema = 'public'
     and table_name in ('profiles', 'evaluations', 'import_batches', 'trainings')) = 4 as tables_ok,
  (select count(*) from information_schema.views
   where table_schema = 'public'
     and table_name in ('evaluation_summary', 'training_stats')) = 2 as views_ok,
  (select count(*) from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('normalize_training_title', 'is_active_user', 'sync_evaluation_training')) = 3 as functions_ok,
  (select count(*) from public.profiles where role = 'admin' and is_active = true) >= 1 as has_active_admin,
  (select count(*) from public.evaluations) > 0 as has_evaluation_data,
  (select count(*) from public.trainings) > 0 as trainings_synced;


-- 11b) Admin login user (matches create-admin.sql / setup.sql)
select
  u.id as auth_user_id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  u.email_confirmed_at is not null as email_confirmed,
  case
    when p.role = 'admin' and p.is_active then 'OK — can import, undo, clear all'
    else 'CHECK — should be admin + active for full feature test'
  end as expected_app_access
from auth.users u
join public.profiles p on p.id = u.id
where p.email = 'jeffson@gmail.com';


-- 11c) RLS policies exist (app needs authenticated read/write)
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'evaluations', 'import_batches', 'trainings')
order by tablename, policyname;


-- 11d) Import history integrity (Import history panel + Undo)
-- After importing in the app: row_count should match linked evaluations.
select
  b.id,
  b.file_name,
  b.source,
  b.row_count as batch_row_count,
  count(e.id) as linked_evaluations,
  b.row_count = count(e.id) as counts_match,
  b.created_at,
  p.email as imported_by
from public.import_batches b
left join public.evaluations e on e.import_batch_id = b.id
left join public.profiles p on p.id = b.imported_by
group by b.id, b.file_name, b.source, b.row_count, b.created_at, p.email
order by b.created_at desc;

-- Batches with zero linked rows (Undo would delete batch only)
select b.*
from public.import_batches b
left join public.evaluations e on e.import_batch_id = b.id
group by b.id
having count(e.id) = 0;


-- 11e) Training auto-sync trigger (evaluations → trainings table)
select
  count(*) as total_evaluations,
  count(*) filter (where training_id is not null) as linked_to_training,
  count(*) filter (where training_id is null) as missing_training_id,
  case
    when count(*) filter (where training_id is null) = 0 then 'OK'
    else 'CHECK — trigger sync_evaluation_training may not have run'
  end as status
from public.evaluations;


-- 11f) Dashboard cards — grouped programs (matches app smart grouping)
-- One row per dashboard card. title_variant_count > 1 → shows in Duplicates filter.
with step1 as (
  select
    e.*,
    regexp_replace(
      regexp_replace(
        public.normalize_training_title(e.training_title),
        '\msamrt\M', 'smart', 'g'
      ),
      '\msustaiable\M|\msustanable\M', 'sustainable', 'g'
    ) as normalized_title
  from public.evaluations e
),
step2 as (
  select
    *,
    (
      select string_agg(w, ' ' order by w)
      from unnest(string_to_array(normalized_title, ' ')) as w
      where length(w) > 2
        and w not in ('and', 'the', 'of', 'conduct', 'program', 'training')
    ) as grouping_key
  from step1
)
select
  s.grouping_key,
  count(distinct s.training_title) as title_variant_count,
  count(distinct s.training_date) as session_count,
  count(distinct nullif(trim(s.venue), '')) as venue_count,
  count(*) as total_responses,
  round(avg(es.overall_average), 2) as avg_score,
  array_agg(distinct s.training_title order by s.training_title) as title_variants
from step2 s
join public.evaluation_summary es on es.id = s.id
group by s.grouping_key
order by total_responses desc, title_variant_count desc;


-- 11g) Duplicates filter — only cards with spelling variants (app: titleVariantCount > 1)
with dashboard_cards as (
  with step1 as (
    select
      e.*,
      regexp_replace(
        regexp_replace(
          public.normalize_training_title(e.training_title),
          '\msamrt\M', 'smart', 'g'
        ),
        '\msustaiable\M|\msustanable\M', 'sustainable', 'g'
      ) as normalized_title
    from public.evaluations e
  ),
  step2 as (
    select
      *,
      (
        select string_agg(w, ' ' order by w)
        from unnest(string_to_array(normalized_title, ' ')) as w
        where length(w) > 2
          and w not in ('and', 'the', 'of', 'conduct', 'program', 'training')
      ) as grouping_key
    from step1
  )
  select
    grouping_key,
    count(distinct training_title) as title_variant_count,
    count(*) as total_responses
  from step2
  group by grouping_key
)
select *
from dashboard_cards
where title_variant_count > 1
order by title_variant_count desc, total_responses desc;


-- 11h) Multi-venue same program (your SSCP case — different offices, combined responses)
with step1 as (
  select
    e.*,
    regexp_replace(
      regexp_replace(
        public.normalize_training_title(e.training_title),
        '\msamrt\M', 'smart', 'g'
      ),
      '\msustaiable\M|\msustanable\M', 'sustainable', 'g'
    ) as normalized_title
  from public.evaluations e
),
step2 as (
  select
    *,
    (
      select string_agg(w, ' ' order by w)
      from unnest(string_to_array(normalized_title, ' ')) as w
      where length(w) > 2
        and w not in ('and', 'the', 'of', 'conduct', 'program', 'training')
    ) as grouping_key
  from step1
)
select
  grouping_key,
  venue,
  training_date,
  count(*) as responses
from step2
where grouping_key like '%sscp%' or grouping_key like '%roadmapping%'
group by grouping_key, venue, training_date
order by grouping_key, training_date, venue;


-- 11i) Dashboard score filters (Strong ≥3.5, Needs attention <3.0)
select
  grouping_key,
  count(*) as responses,
  round(avg(s.overall_average), 2) as avg_score,
  case
    when avg(s.overall_average) >= 3.5 then 'Strong'
    when avg(s.overall_average) < 3.0 then 'Needs attention'
    else 'Middle'
  end as dashboard_filter_bucket
from (
  with step1 as (
    select
      e.id,
      e.training_title,
      regexp_replace(
        regexp_replace(
          public.normalize_training_title(e.training_title),
          '\msamrt\M', 'smart', 'g'
        ),
        '\msustaiable\M|\msustanable\M', 'sustainable', 'g'
      ) as normalized_title
    from public.evaluations e
  ),
  step2 as (
    select
      id,
      (
        select string_agg(w, ' ' order by w)
        from unnest(string_to_array(normalized_title, ' ')) as w
        where length(w) > 2
          and w not in ('and', 'the', 'of', 'conduct', 'program', 'training')
      ) as grouping_key
    from step1
  )
  select step2.grouping_key, es.overall_average
  from step2
  join public.evaluation_summary es on es.id = step2.id
) s
group by grouping_key
order by avg_score desc;


-- 11j) Role matrix — who can do what in the app (no SQL enforces this; profiles.role drives UI)
select
  role,
  count(*) as user_count,
  case role
    when 'admin' then 'import · undo · clear all · export · merge titles'
    when 'staff' then 'import · undo · export · merge titles (no clear all)'
    when 'trainer' then 'import · export (no undo · no clear all)'
    when 'viewer' then 'read-only dashboard'
  end as app_permissions
from public.profiles
where is_active = true
group by role
order by role;


-- 11k) Graph / report data sanity (Program detail + PDF export)
select
  training_title,
  training_date,
  venue,
  count(*) as responses,
  round(avg(overall_average), 2) as avg_score,
  round(avg(overall_percent), 0) as avg_percent
from public.evaluation_summary
group by training_title, training_date, venue
having count(*) >= 1
order by responses desc
limit 20;


-- 11l) Part VI comments present (open-ended feedback in program detail)
select
  training_title,
  count(*) filter (where trim(areas_for_improvement) <> '' and areas_for_improvement not in ('None', 'N/A', 'NA', '-', '.')) as improvement_comments,
  count(*) filter (where trim(future_suggestions) <> '' and future_suggestions not in ('None', 'N/A', 'NA', '-', '.')) as suggestion_comments,
  count(*) as total_rows
from public.evaluations
group by training_title
order by total_rows desc
limit 15;


-- =============================================================================
-- 12. QUICK APP TEST PLAN (manual — after running queries above)
-- =============================================================================
-- 1. Login          → jeffson@gmail.com / 123Admin → query 11b shows admin OK
-- 2. Dashboard      → query 11f row count ≈ number of program cards on screen
-- 3. Duplicates     → filter chip count ≈ query 11g row count
-- 4. SSCP card      → query 11h shows venues/dates; one card with combined responses
-- 5. Import Excel   → re-upload file → query 11d new batch, counts_match = true
-- 6. Merge on import→ query 5 duplicate rows decrease after choosing Merge
-- 7. Import history → Undo batch → query 11d batch gone, evaluations removed
-- 8. Merge titles   → after merge panel → query 6 title_variant_count drops toward 1
-- 9. Export report  → open program → Export → uses data from query 11k
-- 10. Forgot password → Supabase Auth → Email enabled (no SQL — section 9)
