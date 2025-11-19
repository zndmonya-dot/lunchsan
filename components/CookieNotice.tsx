'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'lunchsan-cookie-consent'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY)
      if (!consent) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // storageが使えなくても非表示にする
    }
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="max-w-5xl mx-auto bg-white border-2 border-orange-200 shadow-2xl rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookieと広告について</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            昼食さんでは、利便性向上や Google AdSense 等の広告配信のために Cookie を使用します。詳しくは{' '}
            <Link href="/privacy" className="text-orange-600 font-semibold hover:text-orange-700 underline">
              プライバシーポリシー
            </Link>{' '}
            と{' '}
            <Link href="/terms" className="text-orange-600 font-semibold hover:text-orange-700 underline">
              利用規約
            </Link>
            をご確認ください。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            同意して続行
          </button>
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-800 text-center hover:bg-gray-50 transition-colors"
          >
            広告設定を確認
          </a>
        </div>
      </div>
    </div>
  )
}

