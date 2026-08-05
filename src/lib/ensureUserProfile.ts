import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.email) {
    return
  }

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (readError) {
    throw new Error(`Profile setup failed: ${readError.message}`)
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
        is_active: true,
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Profile setup failed: ${updateError.message}`)
    }

    return
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
    role: 'staff',
    is_active: true,
  })

  if (insertError) {
    throw new Error(`Profile setup failed: ${insertError.message}`)
  }
}
