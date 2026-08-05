-- =============================================================================
-- VERIFY GRAPH DATA (run in Supabase SQL Editor — read-only checks)
-- Graphs/radar are NOT stored separately. They are built from `evaluations`.
-- Add data via: setup.sql seed, Import Excel in the app, or INSERT below.
-- =============================================================================

-- 1) Do you have evaluation rows?
select count(*) as total_evaluations from public.evaluations;

-- 2) Trainings grouped (same logic as the app graphs)
select
  training_title,
  training_date,
  count(*) as responses,
  round(avg(
    (
      relevance_content_job + relevance_topics_needs + materials_organization + examples_practical
      + knowledge_expertise + responded_queries + evidence_based + theory_practical
      + presentation_clear + visual_aids + pacing_timing + encouraged_participation
      + confidence_feedback + courtesy_professionalism + rapport_participants
      + gained_knowledge + apply_learning + competence_improved + inspired_learning
      + venue_conducive + av_equipment + schedule_pacing + coalesce(meals_refreshments, 3)
      + support_staff + overall_satisfaction + recommend_likelihood
    )::numeric / 26.0
  ), 2) as avg_score
from public.evaluations
group by training_title, training_date
order by responses desc;

-- 3) View used by dashboard stats
select * from public.training_stats order by response_count desc limit 20;

-- =============================================================================
-- OPTIONAL: insert ONE test evaluation (change values as needed)
-- Graphs appear automatically after insert — no graph table required.
-- =============================================================================
/*
insert into public.evaluations (
  evaluator_name, contact_number, training_title, venue, training_date,
  relevance_content_job, relevance_topics_needs, materials_organization, examples_practical,
  knowledge_expertise, responded_queries, evidence_based, theory_practical,
  presentation_clear, visual_aids, pacing_timing, encouraged_participation,
  confidence_feedback, courtesy_professionalism, rapport_participants,
  gained_knowledge, apply_learning, competence_improved, inspired_learning,
  venue_conducive, av_equipment, schedule_pacing, meals_refreshments, support_staff,
  overall_satisfaction, recommend_likelihood, areas_for_improvement, future_suggestions
) values (
  'Test User', '09123456789', 'Sample Training Workshop', 'DOST RO2', '2026-05-01',
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  'None', 'More sessions'
);
*/
