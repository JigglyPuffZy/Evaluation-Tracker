export type AppRole = 'admin' | 'staff' | 'trainer' | 'viewer'

export type UserProfile = {
  id: string
  email: string
  fullName: string
  role: AppRole
  office: string | null
  isActive: boolean
}
