import { type NextRequest, NextResponse } from 'next/server'

const SUPABASE_REST_URL = process.env.SUPABASE_REST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_REST_URL) {
  throw new Error('SUPABASE_REST_URL or NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

const FORWARDED_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']

type Params = {
  params: {
    path?: string[]
  }
}

async function proxyRequest(request: NextRequest, params: Params['params']) {
  if (!FORWARDED_METHODS.includes(request.method)) {
    return NextResponse.json(
      { error: `Method ${request.method} is not allowed` },
      { status: 405 }
    )
  }

  const pathSegments = params.path ?? []
  const targetUrl = new URL(`${SUPABASE_REST_URL.replace(/\/$/, '')}/${pathSegments.join('/')}`)
  // 既存のクエリ（select=など）をそのまま引き継ぐ
  targetUrl.search = request.nextUrl.search

  const isBodyMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  const requestBody = isBodyMethod ? await request.text() : undefined

  const headers = new Headers()
  headers.set('apikey', SUPABASE_ANON_KEY)
  headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('content-type', contentType)
  }

  const prefer = request.headers.get('prefer')
  if (prefer) {
    headers.set('prefer', prefer)
  }

  const range = request.headers.get('range')
  if (range) {
    headers.set('range', range)
  }

  const fetchResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: requestBody,
    cache: 'no-store',
    redirect: 'manual',
  })

  const responseHeaders = new Headers(fetchResponse.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, Prefer, Range')
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD')

  return new NextResponse(fetchResponse.body, {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function POST(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function PATCH(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function PUT(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function DELETE(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function OPTIONS(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}

export async function HEAD(request: NextRequest, params: Params) {
  return proxyRequest(request, params.params)
}


