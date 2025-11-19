import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const browserSupabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!browserSupabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL (or proxy) is not set')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }

  return createBrowserClient(
    browserSupabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}










