export type FeedbackFormType = 'csf' | 'training_evaluation'

export type CsfSectionPartId = 'part1' | 'part2' | 'part3' | 'part4' | 'part5'

export type CsfSectionOverride = {
  title?: string
  description?: string
}

export type CsfSectionConfig = Partial<Record<CsfSectionPartId, CsfSectionOverride>>

export const DEFAULT_CSF_SECTIONS: Record<CsfSectionPartId, { title: string; description: string }> =
  {
    part1: {
      title: 'Part 1 — Client information',
      description:
        'This form is authorized under the Citizen’s Charter. Your answers will be kept confidential.',
    },
    part2: {
      title: 'Part 2 — Citizen’s Charter (CC)',
      description:
        'Questions about your awareness and experience with our Citizen’s Charter in this office.',
    },
    part3: {
      title: 'Part 3 — Service availed',
      description: 'Tell us which DOST RO2 office, staff, and services you used.',
    },
    part4: {
      title: 'Part 4 — Service quality (SQD)',
      description:
        'Please rate each statement. Scale: 1 = Strongly Disagree · 5 = Strongly Agree · N/A if not applicable.',
    },
    part5: {
      title: 'Part 5 — Comments & recommendation',
      description: 'Optional suggestions and how likely you are to recommend our services.',
    },
  }

export const CSF_CLIENT_CLASSIFICATIONS = [
  'General citizen',
  'Business',
  'Student',
  'Government',
  'Others',
] as const

export const CSF_CC1_OPTIONS = [
  {
    id: 'cc1_a',
    label:
      'I know what a Citizen’s Charter (CC) is and I saw this office’s CC in this office/service.',
  },
  {
    id: 'cc1_b',
    label: 'I know what a CC is but I did NOT see this office’s CC in this office/service.',
  },
  {
    id: 'cc1_c',
    label: 'I learned of the CC only when I saw this office’s CC in this office/service.',
  },
  {
    id: 'cc1_d',
    label: 'I do not know what a CC is and I did not see one in this office/service.',
  },
] as const

export const CSF_CC2_OPTIONS = [
  { id: 'cc2_a', label: 'Easy to see' },
  { id: 'cc2_b', label: 'Somewhat easy to see' },
  { id: 'cc2_c', label: 'Difficult to see' },
  { id: 'cc2_d', label: 'Not visible at all' },
  { id: 'cc2_na', label: 'Not applicable' },
] as const

export const CSF_CC3_OPTIONS = [
  { id: 'cc3_a', label: 'Helped very much' },
  { id: 'cc3_b', label: 'Somewhat helped' },
  { id: 'cc3_c', label: 'Did not help' },
  { id: 'cc3_na', label: 'Not applicable' },
] as const

export const CSF_SERVICE_GROUPS = [
  {
    id: 'admin',
    title: 'Administrative support services',
    services: [
      'Leave application',
      'Personnel records',
      'Supplies and equipment',
      'Records management',
      'Maintenance and general services',
      'Security services',
      'Other administrative service',
    ],
  },
  {
    id: 'st_suport',
    title: 'Science & technology support services',
    services: [
      'Microbiological / chemical testing',
      'Calibration services',
      'Scholarship services',
      'Training assistance',
      'Technical consultancy',
      'Laboratory / testing services',
      'Other S&T support service',
    ],
  },
  {
    id: 'other_st',
    title: 'Other S&T programs',
    services: [
      'S&T information & promotion',
      'SETUP / livelihood assistance',
      'Grant-in-aid',
      'CEST',
      'STARBOOKS',
      'DRRM / disaster response',
      'Other program or service',
    ],
  },
] as const

export const CSF_SQD_STATEMENTS = [
  { id: 'sqd0', label: 'I am satisfied with the service that I availed.' },
  { id: 'sqd1', label: 'I spent a reasonable amount of time for my transaction.' },
  {
    id: 'sqd2',
    label: 'The office followed the requirements and steps based on the Citizen’s Charter.',
  },
  { id: 'sqd3', label: 'The steps (including payment) I needed to do were easy and simple.' },
  {
    id: 'sqd4',
    label: 'I easily found information about my transaction from the office or its website.',
  },
  { id: 'sqd5', label: 'I paid a reasonable amount of fees for my transaction (if applicable).' },
  { id: 'sqd6', label: 'I feel the office was fair to everyone (“walang palakasan”).' },
  { id: 'sqd7', label: 'I was treated courteously by the staff, and staff were ready to help.' },
  {
    id: 'sqd8',
    label: 'I got what I needed, and/or I was helped with my request or concern.',
  },
] as const

export const CSF_SQD_SCALE = [
  { value: 1, label: 'Strongly Disagree', emoji: '😞' },
  { value: 2, label: 'Disagree', emoji: '😐' },
  { value: 3, label: 'Neutral', emoji: '🙂' },
  { value: 4, label: 'Agree', emoji: '😊' },
  { value: 5, label: 'Strongly Agree', emoji: '😄' },
] as const

export type CsfSubmissionDraft = {
  name: string
  age: string
  sex: '' | 'male' | 'female'
  address: string
  responseDate: string
  clientClassifications: string[]
  clientType: '' | 'internal' | 'external'
  cc1: string
  cc2: string
  cc3: string
  officeUnit: string
  employeeName: string
  servicesAvailed: string[]
  sqd: Record<string, number | 'na' | null>
  comments: string
  recommendScore: number | null
}

export function createEmptyCsfDraft(defaultDate: string): CsfSubmissionDraft {
  const sqd = Object.fromEntries(CSF_SQD_STATEMENTS.map((item) => [item.id, null])) as Record<
    string,
    number | 'na' | null
  >

  return {
    name: '',
    age: '',
    sex: '',
    address: '',
    responseDate: defaultDate,
    clientClassifications: [],
    clientType: '',
    cc1: '',
    cc2: '',
    cc3: '',
    officeUnit: '',
    employeeName: '',
    servicesAvailed: [],
    sqd,
    comments: '',
    recommendScore: null,
  }
}

export function resolveCsfSection(
  partId: CsfSectionPartId,
  config: CsfSectionConfig | undefined,
): { title: string; description: string } {
  const defaults = DEFAULT_CSF_SECTIONS[partId]
  const override = config?.[partId]
  return {
    title: override?.title?.trim() || defaults.title,
    description: override?.description?.trim() || defaults.description,
  }
}
