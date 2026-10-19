import type { CsfFormStats } from '../lib/computeCsfFormStats'
import type { CsfSectionConfig, FeedbackFormType } from './csfForm'

export type FeedbackFormRecord = {
  id: string
  slug: string
  formType: FeedbackFormType
  trainingTitle: string
  venue: string
  trainingDate: string
  welcomeMessage: string
  sectionConfig: CsfSectionConfig
  isPublished: boolean
  showOnDashboard: boolean
  createdAt: string
  responseCount: number
}

export type DashboardCsfFormSummary = FeedbackFormRecord & {
  stats: CsfFormStats
}

export type PublicFeedbackForm = {
  id: string
  slug: string
  formType: FeedbackFormType
  trainingTitle: string
  venue: string
  trainingDate: string
  welcomeMessage: string
  sectionConfig: CsfSectionConfig
}

export type CreateFeedbackFormInput = {
  formType: FeedbackFormType
  trainingTitle: string
  venue: string
  trainingDate: string
  welcomeMessage: string
  sectionConfig: CsfSectionConfig
}
