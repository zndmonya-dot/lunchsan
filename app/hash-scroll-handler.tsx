'use client'

import { useEffect } from 'react'

export default function HashScrollHandler() {
  useEffect(() => {
    // ハッシュ付きURLでページが読み込まれた時やハッシュが変更された時にスクロール位置を調整
    const scrollToHash = () => {
      if (typeof window === 'undefined') return
      
      const hash = window.location.hash
      if (hash) {
        // 少し遅延させてDOMが完全にレンダリングされるのを待つ
        setTimeout(() => {
          const element = document.querySelector(hash)
          if (element) {
            // sticky headerの高さを考慮（約70-80px、余裕を持って100px）
            const headerOffset = 100
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: 'smooth'
            })
          }
        }, 150)
      }
    }

    // 初回読み込み時（少し遅延させてDOMが完全にレンダリングされるのを待つ）
    const initialTimeout = setTimeout(() => {
      if (window.location.hash) {
        scrollToHash()
      }
    }, 200)

    // ハッシュ変更時
    window.addEventListener('hashchange', scrollToHash)

    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('hashchange', scrollToHash)
    }
  }, [])

  return null
}

