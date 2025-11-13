'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { verifyPassword } from '@/lib/password'

// エラーメッセージを日本語に変換する関数
function getJapaneseErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'
  
  // エラーコードに基づく日本語メッセージ
  if (error.code === '23505') {
    return '重複したデータが存在します'
  }
  if (error.code === '23503') {
    return '参照先のデータが見つかりませんでした'
  }
  if (error.code === '23502') {
    return '必須項目が入力されていません'
  }
  if (error.code === 'PGRST116') {
    return '権限がありません'
  }
  if (error.message) {
    // 英語のエラーメッセージを日本語に変換
    const message = error.message.toLowerCase()
    if (message.includes('duplicate key')) {
      return '重複したデータが存在します'
    }
    if (message.includes('foreign key')) {
      return '参照先のデータが見つかりませんでした'
    }
    if (message.includes('not null')) {
      return '必須項目が入力されていません'
    }
    if (message.includes('permission') || message.includes('policy')) {
      return '権限がありません'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください'
    }
  }
  
  return 'エラーが発生しました。しばらく時間をおいて再度お試しください'
}

interface Event {
  id: string
  token: string | null
  title: string | null
  date: string
  creator_name: string | null
  creator_email: string | null
  creator_password_hash: string | null
  created_at: string
}

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'このアプリは無料ですか?',
    answer: 'はい、完全に無料でご利用いただけます。ログインも不要で、URLを送るだけで簡単にお昼ごはんの予定を調整できます。'
  },
  {
    question: '会員登録は必要ですか?',
    answer: 'いいえ、会員登録は一切不要です。名前とメールアドレスを入力するだけで、すぐにお昼ごはんの予定調整を開始できます。'
  },
  {
    question: 'URLは何度でも使えますか?',
    answer: 'はい、予定のURLは何度でも使えます。同じURLで、参加者はいつでも参加状況を変更でき、新しい参加者も追加できます。過去の予定でも、URLがあればアクセスして参加状況を確認・編集できます。'
  },
  {
    question: '他のサービスと何が違うの?',
    answer: '昼食さんはお昼ごはんの予定調整に特化しています。位置情報から近くのお店を検索し、参加者で投票できる機能など、お昼ごはんに最適化された機能を提供しています。'
  },
  {
    question: '使い方を知りたいです。',
    answer: 'トップページの「使い方を見る」ボタンをクリックすると、詳しい使い方を確認できます。3ステップで簡単にお昼ごはんの予定を調整できます。'
  },
  {
    question: '位置情報は必須ですか?',
    answer: 'いいえ、位置情報は必須ではありません。位置情報を許可しない場合でも、お店の名前やエリアで検索できます。ただし、位置情報を許可すると、近くのお店を自動的に検索できるため、より便利にご利用いただけます。'
  },
  {
    question: '参加者の情報はどこまで見えますか?',
    answer: '参加者の名前のみが表示されます。メールアドレスやパスワードなどの個人情報は他の参加者には表示されません。'
  },
  {
    question: 'URLを忘れた場合は?',
    answer: '作成時に使用したメールアドレスを入力すると、予定のURLを検索できます。'
  },
  {
    question: 'パスワードを忘れた場合は?',
    answer: 'セキュリティ上の理由から、パスワードの復元機能は提供していません。パスワードを忘れた場合、予定の編集やリセットはできませんが、予定の閲覧や参加は引き続き可能です。新しい予定を再作成すれば、新しいURLが発行されますので、そちらをご利用ください。'
  }
]

export default function FAQ() {
  const router = useRouter()
  const supabase = createClient()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordReadOnly, setPasswordReadOnly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const toggleQuestion = (index: number) => {
    // 別の質問を開く場合、または現在の質問を閉じる場合、検索フォームをリセット
    if (openIndex !== index) {
      setEvents([])
      setError(null)
      setSearchPerformed(false)
      setEmail('')
      setPassword('')
      setPasswordReadOnly(true)
    }
    setOpenIndex(openIndex === index ? null : index)
  }

  const displayedItems = showAll ? faqItems : faqItems.slice(0, 5)
  const urlForgotIndex = faqItems.findIndex(item => item.question === 'URLを忘れた場合は?')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setError(null)
    setEvents([])
    setSearchPerformed(true)

    if (!email.trim()) {
      setError('メールアドレスを入力してください')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('パスワードを入力してください')
      setLoading(false)
      return
    }

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const trimmedPassword = password.trim()
      
      // メールアドレスとパスワードハッシュを含めて検索
      const { data, error: searchError } = await supabase
        .from('lunch_events')
        .select('id, token, title, date, creator_name, creator_email, creator_password_hash, created_at')
        .eq('creator_email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(10)

      if (searchError) {
        console.error('Error searching events:', searchError)
        setError(getJapaneseErrorMessage(searchError))
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setError('該当する予定が見つかりませんでした')
        setLoading(false)
        return
      }

      // パスワードを検証して、一致するイベントのみをフィルタリング
      const verifiedEvents: Event[] = []
      for (const event of data) {
        if (!event.creator_password_hash) {
          // パスワードが設定されていないイベントはスキップ（セキュリティのため）
          continue
        }
        
        const isPasswordValid = await verifyPassword(trimmedPassword, event.creator_password_hash)
        if (isPasswordValid) {
          verifiedEvents.push(event)
        }
      }

      if (verifiedEvents.length === 0) {
        setError('メールアドレスまたはパスワードが正しくありません')
        setLoading(false)
        return
      }

      // 最大5件まで表示
      setEvents(verifiedEvents.slice(0, 5))
      setLoading(false)
    } catch (error: any) {
      console.error('Error:', error)
      setError(getJapaneseErrorMessage(error))
      setLoading(false)
    }
  }

  const handleCopyUrl = async (token: string | null, eventId: string) => {
    const url = `${window.location.origin}/events/${token || eventId}`
    try {
      // Clipboard APIが利用可能な場合
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // フォールバック: 古いブラウザやHTTPSでない環境用
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Failed to copy URL:', err)
          return
        }
        document.body.removeChild(textArea)
      }
      // コピー成功時にメッセージを表示
      setCopiedUrl(url)
      setTimeout(() => {
        setCopiedUrl(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleOpenEvent = (token: string | null, eventId: string) => {
    router.push(`/events/${token || eventId}`)
  }

  return (
    <section className="bg-gray-50 py-16 md:py-20">
      {/* コピー成功メッセージ */}
      {copiedUrl && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <i className="ri-checkbox-circle-line text-xl"></i>
          <span className="font-medium">コピーしました</span>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="mb-4">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm inline-flex mx-auto">
              <i className="ri-question-line text-white text-xl"></i>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">よくある質問</h2>
          <p className="text-gray-700 text-sm font-medium">昼食さんについて、よくいただく質問をまとめました</p>
        </div>

        <div className="space-y-3 mb-8">
          {displayedItems.map((item, index) => (
            <div
              key={index}
              className="bg-white border-2 border-orange-200 rounded-xl hover:shadow-lg hover:border-orange-300 transition-all"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-orange-50/30 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">Q</span>
                  </div>
                  <span className="text-gray-900 font-semibold text-sm md:text-base">
                    {item.question}
                  </span>
                </div>
                <i className={`ri-arrow-down-s-line text-orange-600 text-xl transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? 'transform rotate-180' : ''
                }`}></i>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 ml-11">
                  <div className="pt-3 border-t border-gray-200">
                    {index === urlForgotIndex ? (
                      // URLを忘れた場合の検索フォーム - 左上から右下への視線の流れに最適化
                      <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed font-medium text-sm mb-4">{item.answer}</p>
                        <form onSubmit={handleSearch} noValidate autoComplete="off" className="space-y-3">
                          {/* 左上: メールアドレス入力 */}
                          <div>
                            <label htmlFor="search-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                              メールアドレス <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="search-email"
                              name="email-search-faq"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              autoComplete="email"
                              placeholder="作成時に使用したメールアドレス"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                              disabled={loading}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {/* 左下: パスワード入力 */}
                          <div>
                            <label htmlFor="search-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                              パスワード <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="search-password"
                              name="password-search-faq"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="new-password"
                              readOnly={passwordReadOnly}
                              onFocus={() => setPasswordReadOnly(false)}
                              placeholder="作成時に設定したパスワード"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                              disabled={loading}
                              onClick={(e) => {
                                e.stopPropagation()
                                setPasswordReadOnly(false)
                              }}
                            />
                          </div>
                          {/* 右下: 検索ボタン */}
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>検索中...</span>
                              </>
                            ) : (
                              <>
                                <i className="ri-search-line"></i>
                                <span>検索</span>
                              </>
                            )}
                          </button>
                        </form>

                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                          </div>
                        )}

                        {events.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-sm font-medium text-gray-700">見つかった予定 ({events.length}件)</p>
                            {events.map((event) => {
                              const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.token || event.id}`
                              const eventDate = new Date(event.date)
                              
                              return (
                                <div
                                  key={event.id}
                                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm truncate">
                                        {event.title || 'タイトルなし'}
                                      </p>
                                      <p className="text-gray-600 text-xs mt-1">
                                        {format(eventDate, 'M月d日', { locale: ja })}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => handleCopyUrl(event.token, event.id)}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                                        title="URLをコピー"
                                      >
                                        <i className="ri-file-copy-line"></i>
                                      </button>
                                      <button
                                        onClick={() => handleOpenEvent(event.token, event.id)}
                                        className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors shadow-sm"
                                        title="開く"
                                      >
                                        <i className="ri-external-link-line"></i>
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    readOnly
                                    value={eventUrl}
                                    className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-600 truncate"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      ;(e.target as HTMLInputElement).select()
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-relaxed font-medium">{item.answer}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!showAll && faqItems.length > 5 && (
          <div className="text-center">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-3 border-2 border-orange-300 text-gray-700 rounded-xl font-semibold hover:bg-orange-50 hover:border-orange-400 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto transition-all"
            >
              質問をもっと見る
              <i className="ri-arrow-right-line text-lg"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

