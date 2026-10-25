import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wamaaayjyjmxljbcynny.supabase.co'
const supabaseAnonKey = 'sb_publishable_4Xrgak28R1dRQXUPWZOm_Q_cr49fpAO'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)