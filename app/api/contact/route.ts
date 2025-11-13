import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * お問い合わせフォーム送信API
 * POST /api/contact
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '名前、メールアドレス、お問い合わせ内容は必須です。' },
        { status: 400 }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '正しいメールアドレスを入力してください。' },
        { status: 400 }
      )
    }

    // 文字数制限チェック
    if (name.length > 100) {
      return NextResponse.json(
        { error: '名前は100文字以内で入力してください。' },
        { status: 400 }
      )
    }

    if (subject && subject.length > 200) {
      return NextResponse.json(
        { error: '件名は200文字以内で入力してください。' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'お問い合わせ内容は5000文字以内で入力してください。' },
        { status: 400 }
      )
    }

    // Supabaseに保存
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving contact inquiry:', error)
      return NextResponse.json(
        { error: 'お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'お問い合わせを受け付けました。',
        id: data.id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in contact API:', error)
    return NextResponse.json(
      { error: '内部エラーが発生しました。しばらく時間をおいて再度お試しください。' },
      { status: 500 }
    )
  }
}

