import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.email) {
    return
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      role: 'staff',
      is_active: true,
    },
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`Profile setup failed: ${error.message}`)
  }
}
