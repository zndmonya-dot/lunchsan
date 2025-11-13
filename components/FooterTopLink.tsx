'use client'

import { usePathname } from 'next/navigation'

export default function FooterTopLink() {
  const pathname = usePathname()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault()
      // ハッシュをクリア
      if (typeof window !== 'undefined') {
        window.history.pushState('', '', '/')
        // トップにスムーズスクロール
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }
    // 他のページの場合は通常のリンク動作
  }

  return (
    <a 
      href="/" 
      onClick={handleClick}
      className="hover-link text-gray-700 text-sm font-medium transition-colors hover:text-orange-600 cursor-pointer"
    >
      トップページ
    </a>
  )
}

