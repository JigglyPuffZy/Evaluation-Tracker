export const RATING_SCALE_MAX = 4

export const RATING_FIELD_KEYS = [
  'relevance_content_job',
  'relevance_topics_needs',
  'materials_organization',
  'examples_practical',
  'knowledge_expertise',
  'responded_queries',
  'evidence_based',
  'theory_practical',
  'presentation_clear',
  'visual_aids',
  'pacing_timing',
  'encouraged_participation',
  'confidence_feedback',
  'courtesy_professionalism',
  'rapport_participants',
  'gained_knowledge',
  'apply_learning',
  'competence_improved',
  'inspired_learning',
  'venue_conducive',
  'av_equipment',
  'schedule_pacing',
  'meals_refreshments',
  'support_staff',
  'overall_satisfaction',
  'recommend_likelihood',
] as const

export type RatingFieldKey = (typeof RATING_FIELD_KEYS)[number]

export const RATING_FIELD_LABELS: Record<RatingFieldKey, string> = {
  relevance_content_job: 'Relevance of training content to job or function',
  relevance_topics_needs: "Appropriateness of learning topics to participants' needs",
  materials_organization: 'Adequacy and organization of training materials provided',
  examples_practical: 'Integration of examples, case studies, or practical applications',
  knowledge_expertise: 'Demonstrated in-depth knowledge and expertise on the topic',
  responded_queries: "Responded effectively to participants' queries",
  evidence_based: 'Shared updated and evidence-based content developments',
  theory_practical: 'Balanced theory with practical applications',
  presentation_clear: 'Presentation was clear, organized, and engaging',
  visual_aids: 'Used effective visual aids or instructional materials',
  pacing_timing: 'Maintained appropriate pacing and timing',
  encouraged_participation: 'Encouraged participation and discussion',
  confidence_feedback: 'Presented confidence and openness to feedback',
  courtesy_professionalism: 'Exhibited courtesy and professionalism throughout the session',
  rapport_participants: 'Established good rapport with participants',
  gained_knowledge: 'I have gained new knowledge.',
  apply_learning: 'I can apply what I learned to my work or projects.',
  competence_improved: 'The training improved my competence or performance potential.',
  inspired_learning: 'The training inspired me to pursue further learning.',
  venue_conducive: 'The venue was conducive to learning',
  av_equipment: 'Audio-visual facilities and equipment functioned properly',
  schedule_pacing: 'Training schedule and pacing were suitable',
  meals_refreshments: 'Meals and refreshments were timely and adequate',
  support_staff: 'Support staff and technical personnel were helpful and responsive',
  overall_satisfaction: 'Overall satisfaction with the training activity',
  recommend_likelihood: 'Likelihood of recommending similar training to others',
}

export const EVALUATION_SECTIONS = [
  {
    id: 'part1',
    title: 'Part I — Training Content and Delivery',
    fields: [
      'relevance_content_job',
      'relevance_topics_needs',
      'materials_organization',
      'examples_practical',
    ] as const,
  },
  {
    id: 'part2',
    title: 'Part II — Resource Speakers',
    fields: [
      'knowledge_expertise',
      'responded_queries',
      'evidence_based',
      'theory_practical',
      'presentation_clear',
      'visual_aids',
      'pacing_timing',
      'encouraged_participation',
      'confidence_feedback',
      'courtesy_professionalism',
      'rapport_participants',
    ] as const,
  },
  {
    id: 'part3',
    title: 'Part III — Learning Outcomes and Application',
    fields: [
      'gained_knowledge',
      'apply_learning',
      'competence_improved',
      'inspired_learning',
    ] as const,
  },
  {
    id: 'part4',
    title: 'Part IV — Training Environment and Logistics',
    fields: [
      'venue_conducive',
      'av_equipment',
      'schedule_pacing',
      'meals_refreshments',
      'support_staff',
    ] as const,
  },
  {
    id: 'part5',
    title: 'Part V — Overall Assessment',
    fields: ['overall_satisfaction', 'recommend_likelihood'] as const,
  },
] as const

export const PART_VI_SECTION = {
  id: 'part6',
  title: 'Part VI — Comments',
  fields: [
    {
      key: 'areas_for_improvement',
      label: 'Areas for improvement',
    },
    {
      key: 'future_suggestions',
      label: 'Future training suggestions',
    },
  ] as const,
} as const

export type SectionId = (typeof EVALUATION_SECTIONS)[number]['id']

export const EVALUATION_CSV_HEADERS = [
  'evaluator_name',
  'training_title',
  'contact_number',
  'venue',
  'training_date',
  ...RATING_FIELD_KEYS,
  'areas_for_improvement',
  'future_suggestions',
] as const

export type EvaluationCsvHeader = (typeof EVALUATION_CSV_HEADERS)[number]

export type EvaluationRow = {
  id: string
  evaluator_name: string
  training_title: string
  contact_number: string
  venue: string
  training_date: string
  areas_for_improvement: string
  future_suggestions: string
} & Record<RatingFieldKey, number>

export const RATING_BANDS = [
  { score: 4, label: 'Strongly Agree / Excellent' },
  { score: 3, label: 'Agree / Very Satisfactory' },
  { score: 2, label: 'Disagree / Needs Improvement' },
  { score: 1, label: 'Strongly Disagree / Poor' },
] as const
