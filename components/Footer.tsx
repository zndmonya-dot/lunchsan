import FooterTopLink from './FooterTopLink'

export default function Footer() {

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* 左側: ロゴと説明 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <i className="ri-bowl-fill text-white text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">昼食さん</h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed max-w-md font-medium">
              「昼食さん」はURLを送るだけで、出欠確認、場所選びができるアプリです。
              面倒なログイン一切不要で、すぐに使えます。
            </p>
          </div>

          {/* 右側: ナビゲーションリンク */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* サービス */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-sm">サービス</h4>
              <ul className="space-y-2">
                <li>
                  <FooterTopLink />
                </li>
                <li>
                  <a href="#create-form" className="hover-link text-gray-700 text-sm font-medium">
                    予定を作成
                  </a>
                </li>
                <li>
                  <a href="#usage-guide" className="hover-link text-gray-700 text-sm font-medium">
                    使い方
                  </a>
                </li>
              </ul>
            </div>

            {/* 法的情報 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-sm">法的情報</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className="hover-link text-gray-700 text-sm font-medium transition-colors hover:text-orange-600">
                    利用規約
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover-link text-gray-700 text-sm font-medium transition-colors hover:text-orange-600">
                    プライバシーポリシー
                  </a>
                </li>
              </ul>
            </div>

            {/* サポート */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-sm">サポート</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/#faq" className="hover-link text-gray-700 text-sm font-medium transition-colors hover:text-orange-600">
                    よくある質問
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover-link text-gray-700 text-sm font-medium transition-colors hover:text-orange-600">
                    お問い合わせ
                  </a>
                </li>
              </ul>
            </div>

            {/* SNS */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-sm">SNS</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://twitter.com/minna_de_ohiru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover-link text-gray-700 text-sm flex items-center gap-2 font-medium transition-colors hover:text-orange-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X (Twitter)
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 著作権情報 */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-700 text-sm font-medium">© 2025 昼食さん. All rights reserved.</p>
          <p className="text-gray-700 text-sm font-medium">Developed with <span className="text-orange-600">❤️</span> for better lunch coordination</p>
        </div>
      </div>
    </footer>
  )
}

