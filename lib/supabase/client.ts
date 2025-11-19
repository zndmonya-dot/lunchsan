import { createBrowserClient } from '@supabase/ssr'

function normalizeSupabaseUrl(url?: string) {
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return url.replace(/\/+$/, '')
}

function normalizeProxyPath(rawPath?: string | null) {
  if (!rawPath || !rawPath.trim()) {
    return '/api/supabase'
  }

  const trimmed = rawPath.trim()

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      const pathname = parsed.pathname === '/' ? '' : parsed.pathname
      const combined = `${pathname}${parsed.search}${parsed.hash}` || '/api/supabase'
      return combined.startsWith('/') ? combined : `/${combined}`
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

  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const proxyPath = normalizeProxyPath(process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL)

  const rewriteFetch: typeof fetch = (input, init) => {
    const rewriteUrl = (url: string): string => {
      if (!url.startsWith(supabaseUrl)) {
        return url
      }
      const suffix = url.slice(supabaseUrl.length)
      const path = suffix.startsWith('/') ? suffix : `/${suffix}`
      const rewritten = `${proxyPath}${path}`
      return rewritten.startsWith('/') ? rewritten : `/${rewritten}`
    }

    if (typeof input === 'string') {
      return fetch(rewriteUrl(input), init)
    }

    if (input instanceof URL) {
      const rewritten = rewriteUrl(input.toString())
      return fetch(rewritten, init)
    }

    if (input instanceof Request) {
      const rewritten = rewriteUrl(input.url)
      if (rewritten === input.url) {
        return fetch(input, init)
      }
      const cloned = new Request(rewritten, input)
      return fetch(cloned, init)
    }

    return fetch(input, init)
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: rewriteFetch,
    },
  })
}










