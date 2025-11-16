'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function QuickStartForm() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // イベント作成ページにリダイレクト（パラメータ付き）
    const params = new URLSearchParams()
    if (eventName) params.set('title', eventName)
    if (date) params.set('date', date)
    router.push(`/events/new?${params.toString()}`)
  }

  return (
    <section className="bg-white py-16 border-t-2 border-orange-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">予定調整を始める</h2>
              <p className="text-sm text-gray-600">簡単な入力で、すぐに予定調整を始められます</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Form fields */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-bold text-gray-900 mb-2">
                    1 イベント名
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    autoComplete="off"
                    placeholder="例) 今期もお疲れ様でした飲み会など"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
                    説明（任意）
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="例) 今期もお疲れ様でした! 楽しい会で盛り上げて祝いましょう~!"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Right: Date selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  2 日程
                </label>
                <div className="bg-white rounded-lg p-4 border-2 border-gray-300 mb-4">
                  <div className="mb-4">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      選択中の日程 (1)
                    </p>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-orange-900 font-medium">{format(new Date(date), 'M月d日(E)', { locale: ja })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="px-12 py-4 bg-orange-600 text-white rounded-lg font-bold text-lg hover:bg-orange-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
              >
                作成してURLをコピー
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

