import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// When the keys are not set the site still works: sign-in and checkout are
// switched off and the pricing buttons fall back to the waitlist form.
export const supabase = url && key ? createClient(url, key) : null
export const authEnabled = supabase !== null
