import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // すべてのページを公開アクセス可能にする（認証不要）
  return NextResponse.next({
    request,
  })
}

