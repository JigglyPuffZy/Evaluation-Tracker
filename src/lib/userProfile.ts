import type { AppRole, UserProfile } from '../types/user'
import { supabase } from './supabase'

type DbProfile = {
  id: string
  email: string
  full_name: string | null
  role: AppRole
  office: string | null
  is_active: boolean
}

function mapProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name?.trim() || row.email.split('@')[0] || 'User',
    role: row.role,
    office: row.office,
    isActive: row.is_active,
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, office, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapProfile(data as DbProfile) : null
}
