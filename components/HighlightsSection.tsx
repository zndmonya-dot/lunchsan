'use client'

const coreBenefits = [
  {
    title: '毎日0時に自動リセット',
    description: '参加者・投票結果・コメントを自動で初期化。リンクの貼り替え不要で常連メンバーにも使いやすい。',
    icon: 'ri-refresh-line'
  },
  {
    title: 'リアルタイム参加状況',
    description: '誰が参加できるかをステータスで表示。迷っている人も「未定」で把握できます。',
    icon: 'ri-road-map-line'
  },
  {
    title: '位置情報からお店候補',
    description: '現在地・手動入力どちらでもOK。Googleマップと連携して近くのお店を即表示します。',
    icon: 'ri-restaurant-line'
  },
  {
    title: '投票で決定まで一気通貫',
    description: '候補を追加して投票→得票数順に表示。控えめなメンバーの声も拾えます。',
    icon: 'ri-vote-line'
  }
]

const automationPoints = [
  { title: 'イベントURLの生成', detail: '作成後すぐに共有できる固有URLを発行' },
  { title: 'Supabaseで安全に保存', detail: '回答データはRLS付きDBに保存' },
  { title: 'ステータス更新の通知', detail: '画面上ですぐに反映。リロード不要' }
]

export default function HighlightsSection() {
  return (
    <section className="bg-white py-14 md:py-16" id="features">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div>
            <p className="text-sm font-semibold text-orange-600 mb-3">Lunchsan Highlights</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              お昼の予定調整に必要な機能を全部まとめました
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              チャットで日程調整 → Googleフォーム → 別シート …… そんな面倒を減らすために、
              昼食さんは出欠・場所・投票までを一つの画面で完結させることにこだわっています。
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-10">
              {coreBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 hover:border-orange-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                    <i className={`${benefit.icon} text-xl`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-4">自動化されること</p>
            <div className="space-y-4 mb-6">
              {automationPoints.map((point) => (
                <div key={point.title} className="flex gap-3 items-start rounded-2xl bg-white border border-gray-200 p-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <i className="ri-sparkling-2-line text-lg"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{point.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{point.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-2">おすすめの使い方</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>・ 毎日同じメンバーでランチ当番を決めるチーム</li>
                <li>・ 複数店舗を検討しながらスムーズに決定したいとき</li>
                <li>・ 社内・友人などログインさせたくない場面</li>
              </ul>
              <a
                href="#create-form"
                className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
              >
                予定を作成してみる
                <i className="ri-arrow-right-up-line text-base"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

