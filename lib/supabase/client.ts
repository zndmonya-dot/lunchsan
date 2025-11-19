import { createBrowserClient } from '@supabase/ssr'

function resolveProxyUrl(rawUrl?: string | null) {
  if (!rawUrl || !rawUrl.trim()) {
    return '/api/supabase'
  }

  const trimmed = rawUrl.trim()

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      const pathname = parsed.pathname === '/' ? '' : parsed.pathname
      const resolved =
        `${pathname}${parsed.search}${parsed.hash}` || '/api/supabase'
      return resolved.startsWith('/') ? resolved : `/${resolved}`
    } catch {
      return '/api/supabase'
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function createClient() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }

  const proxyUrl = resolveProxyUrl(process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL)

  return createBrowserClient(proxyUrl, supabaseAnonKey)
}










