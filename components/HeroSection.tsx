'use client'

const checklist = [
  {
    title: 'URLを送るだけ',
    description: 'URLひとつでみんなが同じ画面を見られます。説明なしでも伝わります。'
  },
  {
    title: 'ログイン不要',
    description: '名前とメールだけで参加OK。ゲストもすぐに回答できます。'
  },
  {
    title: '位置情報でお店候補',
    description: '現在地や手入力から近くのお店を提案。候補探しで迷いません。'
  }
]

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-orange-50 py-12 sm:py-16 md:py-24 lg:py-28">

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 border border-orange-200 text-xs font-semibold text-orange-700 shadow-sm mb-5 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            昼休みの「どこ行く？」をスッキリ解決
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5 sm:mb-6 px-2">
            お昼ごはんの予定、<br className="hidden sm:block" />
            もっと楽しく決めよう
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            昼食さんは調整さんのような気軽さで、お店探しから投票まで楽しめるランチ専用ツール。
            URLをひとつ送るだけで、今日行けるメンバーと候補のお店がパッと揃います。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-12 max-w-3xl mx-auto">
            {checklist.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2.5 sm:gap-3 p-4 sm:p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:bg-white hover:shadow-md transition-all">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-md">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base mb-1 sm:mb-1.5">{item.title}</p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center px-2">
            <a
              href="#create-form"
              className="group px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 bg-orange-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-orange-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-[48px] sm:h-[52px] touch-manipulation transition-all"
            >
              今すぐ始める
              <i className="ri-arrow-right-line text-lg sm:text-xl"></i>
            </a>
            <a
              href="#usage-guide"
              className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-50 hover:border-orange-300 shadow-md flex items-center justify-center min-h-[48px] sm:h-[52px] touch-manipulation transition-all"
            >
              使い方を見る
            </a>
          </div>
          <p className="mt-4 sm:mt-5 text-xs text-gray-500 px-2">
            * 毎日0時に参加者・投票状況を自動リセット。常連メンバーも同じURLを使い続けられます。
          </p>
        </div>
      </div>
    </section>
  )
}

