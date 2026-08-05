-- Auto-generated from Training Evaluation Form (Responses).xlsx
-- Run AFTER supabase/schema.sql
-- Rows: 23

insert into public.import_batches (source, file_name, row_count, notes)
values ('excel', 'Training Evaluation Form (Responses).xlsx', 23, 'Google Form export seed data');

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
  (timezone('utc', timestamp '2026-04-21 15:23:26'), 'Shara Mae D. Sabbaluca', '09174652010', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM (SSCP) ROADMAPPING WORKSHOP ', 'Function Hall, Mayor’s Office, LGU Echague', '2026-04-20', 4, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 4, 4, 3, null, 4, 4, 4, 'None', 'Internal data system'),
  (timezone('utc', timestamp '2026-04-21 15:23:35'), 'Melissa G. Corpuz', '09178886930', 'Smart and sustainable community program (sscp) roadmapping  workshop', 'New mayor''s office, echague. Isabela', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, '.', '.'),
  (timezone('utc', timestamp '2026-04-21 15:23:39'), 'Jennie S. Quidawen', '09338653506', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'New Mayor''s Office Function Hall', '2026-04-21', 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 3, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:23:50'), 'Gretchen S. Abuena, MD.', '09178687619', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor’s Office function Hall', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:23:50'), 'ERIC M. BUGARIN', '09652242435', 'SAMRT AND SUSTAINABLE COMMUNITY PROGRAM(SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'good', 'none'),
  (timezone('utc', timestamp '2026-04-21 15:23:54'), 'Jacqueline A. Casco-Buduan', '09175741710', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM(SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office Function Hall', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'NA', 'NA'),
  (timezone('utc', timestamp '2026-04-21 15:24:20'), 'NEM G. CASTILLO', '09998698900', 'Sscp', 'Echague', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'Na', 'Na'),
  (timezone('utc', timestamp '2026-04-21 15:27:35'), 'MARYANN R. SARANDI', '0910-323-7712', 'SMART AND SUSTAINABLE COMMUNITY PROGRAM (SSCP) ROADMAPPING WORKSHOP', 'Mayor''s Office Function Hall', '2026-04-21', 4, 3, 3, 3, 4, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, null, 4, 4, 4, 'None', 'None'),
  (timezone('utc', timestamp '2026-04-21 15:28:23'), 'Dawn Louella C. Panaligan', '09691845108', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'San Fabian, Echague Isabela', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/a', 'N/a'),
  (timezone('utc', timestamp '2026-04-21 15:30:27'), 'Janice D. Laman', '09552573377', 'smart and sustainable community program (SSCP) ROADMAPPING WORKSHOP', 'SAN FABIAN ECHAGUE ISABELA', '2026-04-21', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, null, 1, 1, 1, 'N/A', 'N/A'),
  (timezone('utc', timestamp '2026-04-21 15:32:07'), '', '09212751304', 'SSCP Roadmapping Workshop', 'Mayor''s Office, San Fabian, Echague, Isabela', '2026-04-20', 3, 3, 3, 3, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, null, 3, 3, 3, 'SSCP could be broader, dates could''ve been adjusted to accommodate more topics', 'Expound on SSCP before narrowing it down to the target'),
  (timezone('utc', timestamp '2026-04-21 15:35:41'), 'Roy Angelo Gaffud', '09669539052', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor''s Office LGU Echague Isabela', '2026-04-21', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/A', 'N/A'),
  (timezone('utc', timestamp '2026-04-21 15:37:55'), 'Roy Angelo Gaffud', '09669539052', 'Smart and Sustainable Community Program (SSCP) Roadmapping Workshop', 'Mayor''s Office LGU Echague', '2026-04-20', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, 4, 4, 4, 'N/A', 'N/A');

-- Verify: select count(*) from public.evaluations;
-- select * from public.training_stats order by response_count desc;