'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // バリデーション
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('名前、メールアドレス、お問い合わせ内容は必須です。')
      setLoading(false)
      return
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('正しいメールアドレスを入力してください。')
      setLoading(false)
      return
    }

    try {
      // 実際の実装では、ここでSupabaseやメール送信サービスに送信
      // 今回は、フォーム送信のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError('送信に失敗しました。しばらく時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 p-6 md:p-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="ri-mail-line text-white text-xl"></i>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">お問い合わせ</h1>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              ご質問、ご意見、ご要望などがございましたら、お気軽にお問い合わせください。
              <br />
              お問い合わせ内容を確認後、3営業日以内にご返信いたします。
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <i className="ri-checkbox-circle-line text-green-600 text-2xl"></i>
                <h2 className="text-lg font-semibold text-green-800">お問い合わせを受け付けました</h2>
              </div>
              <p className="text-sm text-green-700 leading-relaxed">
                お問い合わせありがとうございます。内容を確認後、ご入力いただいたメールアドレスにご返信いたします。
                <br />
                3営業日以内にご返信いたしますので、しばらくお待ちください。
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                新しいお問い合わせを送信
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <i className="ri-error-warning-line text-red-600 text-lg"></i>
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm font-medium min-h-[48px] bg-white"
                  placeholder="例: 田中"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm font-medium min-h-[48px] bg-white"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  件名
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm font-medium min-h-[48px] bg-white"
                  placeholder="例: 機能についての質問"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={8}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all text-gray-900 placeholder:text-gray-400 text-sm font-medium bg-white"
                  placeholder="お問い合わせ内容をご記入ください..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-semibold shadow-md hover:shadow-lg min-h-[48px] touch-manipulation transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>送信中...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line text-lg"></i>
                      <span>送信する</span>
                    </>
                  )}
                </button>
                <a
                  href="/"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold border-2 border-gray-300 min-h-[48px] touch-manipulation transition-all flex items-center justify-center"
                >
                  キャンセル
                </a>
              </div>
            </form>
          )}

          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-information-line text-orange-600"></i>
                よくある質問
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                よくある質問については、<a href="/#faq" className="text-orange-600 hover:text-orange-700 underline font-semibold">FAQページ</a>をご確認ください。
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                技術的な問題や不具合については、可能な限り詳細な情報（発生した操作、エラーメッセージ、使用環境など）を含めてお問い合わせいただくと、より迅速に対応できます。
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

