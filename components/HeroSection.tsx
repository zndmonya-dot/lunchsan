'use client'

const checklist = [
  {
    title: 'URLを送るだけ',
    description: 'URLひとつでみんなが同じ画面に集合。説明なしでも伝わります。'
  },
  {
    title: 'ログイン不要',
    description: '名前とメールだけで参加OK。ゲストもすぐに答えられます。'
  },
  {
    title: '位置情報でお店候補',
    description: '現在地や手入力から周辺のお店を提案。候補探しで迷いません。'
  }
]

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-100 via-orange-50 to-white py-16 md:py-24 lg:py-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 w-64 h-64 bg-orange-200/40 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-16 left-10 w-72 h-72 bg-orange-100/50 blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-orange-200 text-xs font-semibold text-orange-700 shadow-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              昼休みの「どこ行く？」をふわっと解決
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              お昼ごはんの予定、<br className="hidden sm:block" />
              もっと楽しく決めよう
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl mb-8">
              昼食さんは調整さん譲りの気軽さに「お店探し」と「投票のワクワク」を足したランチ専用ツール。
              URLをひとつ送るだけで、今日行けるメンバーと候補のお店がふんわりそろいます。
            </p>

            <div className="space-y-4 mb-10">
              {checklist.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-green-500/90 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="#create-form"
                className="group px-8 md:px-10 py-4 bg-orange-600 text-white rounded-xl font-semibold text-base hover:bg-orange-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 h-[52px] touch-manipulation transition-all"
              >
                今すぐ始める
                <i className="ri-arrow-right-line text-xl"></i>
              </a>
              <a
                href="#usage-guide"
                className="px-8 md:px-10 py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-xl font-semibold text-base hover:bg-orange-50 hover:border-orange-300 shadow-md flex items-center justify-center h-[52px] touch-manipulation transition-all"
              >
                使い方を見る
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              * 毎日0時に参加者・投票状況を自動リセット。常連メンバーも同じURLを使い続けられます。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-orange-100 shadow-xl p-7 md:p-9">
            <p className="text-sm font-semibold text-gray-600 mb-4">昼食さんの進め方</p>
            <div className="space-y-4">
              {[
                { title: '予定を作る', desc: '日付や時間、イベント名、お店の候補を入力。準備は1分ほどで完了します。' },
                { title: 'URLを送る', desc: 'できあがったURLをSlackやLINEに貼るだけ。全員が同じページにアクセスできます。' },
                { title: '回答＆投票', desc: '参加可否と一言コメントを入力して、気になるお店に投票。リアルタイムで結果が見られます。' }
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 flex gap-4 items-start"
                >
                  <span className="text-lg font-bold text-orange-600">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-orange-600/5 border border-orange-200 p-5">
              <p className="text-sm font-semibold text-orange-800 mb-1">毎日同じURLでOK</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                「毎日自動初期化」で常連メンバーとの定例ランチにも使えます。参加者はブックマークさえしておけば即回答。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

