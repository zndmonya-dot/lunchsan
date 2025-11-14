'use client'

const coreBenefits = [
  {
    title: '毎日同じURLでOK',
    description: '0時になると回答だけ自動でリセット。みんなが同じリンクをずっと使えます。',
    icon: 'ri-refresh-line'
  },
  {
    title: '参加状況がひと目でわかる',
    description: '回答済みのメンバーがリストにまとまるので、誰が返事したかがすぐ分かります。',
    icon: 'ri-road-map-line'
  },
  {
    title: '近くのお店をその場で提案',
    description: '現在地や手入力から周辺のお店を自動提案。候補を探す手間がほぼゼロになります。',
    icon: 'ri-restaurant-line'
  },
  {
    title: '投票でスムーズに決定',
    description: '各自が投票すると得票順に並ぶので、好みの違いもサクッと整理できます。',
    icon: 'ri-vote-line'
  }
]

const userStories = [
  {
    title: '参加状況の把握がラクになった',
    detail: '昼食さんにアクセスすれば最新の回答が並ぶので、誰に声をかければいいかすぐ分かるようになりました。'
  },
  {
    title: 'お店決めが盛り上がる',
    detail: '候補を並べて投票するだけで、意外な人気店が分かったりと会話が楽しくなりました。'
  },
  {
    title: 'リンクを固定できて安心',
    detail: '毎朝リンクを探す手間がなくなり、「今日もあのURLで入力してね」で済むようになりました。'
  }
]

export default function HighlightsSection() {
  return (
    <section className="bg-white py-14 md:py-16" id="features">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div>
            <p className="text-sm font-semibold text-orange-600 mb-3">Lunchsan Highlights</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              「今日どこ行く？」のお悩みを全部まとめて解決
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              チャットで出欠を取り、別ツールでお店を決めて…と分かれている作業を一画面に集約。
              日常の「お昼どうする？」を数タップで終わらせます。
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
            <p className="text-sm font-semibold text-gray-700 mb-4">使っている人の声</p>
            <div className="space-y-4 mb-6">
              {userStories.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-2">昼食さんでできること</p>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>・ URLを一度共有すれば、その後は貼り直し不要</li>
                <li>・ 雨の日も徒歩圏のお店を自動で出してくれる</li>
                <li>・ 投票結果が並ぶので、決め手がない時でもサッと決定</li>
              </ul>
              <a
                href="#create-form"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors w-full text-center"
              >
                1分で予定を作成する
                <i className="ri-arrow-right-up-line text-base"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

