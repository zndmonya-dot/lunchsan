'use client'

const coreBenefits = [
  {
    title: '毎日同じURLでOK',
    description: '0時になると回答だけ自動でリセット。ブックマークしたURLを毎朝そのまま使えます。',
    icon: 'ri-refresh-line'
  },
  {
    title: '参加状況がひと目でわかる',
    description: '回答済みのメンバーが一覧で並ぶので、声かけ漏れがひと目で防げます。',
    icon: 'ri-road-map-line'
  },
  {
    title: '近くのお店をその場で提案',
    description: '現在地や手入力から周辺のお店をすぐ提案。候補探しで立ち止まる時間を減らせます。',
    icon: 'ri-restaurant-line'
  },
  {
    title: '投票でスムーズに決定',
    description: '投票すると得票順に並ぶので、好みが分かれてもスムーズにまとまります。',
    icon: 'ri-vote-line'
  }
]

const userStories = [
  {
    title: '参加状況の把握がラクになった',
    detail: '昼食さんにアクセスすれば最新の回答が並ぶので、誰に声をかければいいかすぐ分かるようになりました。'
  },
  {
    title: '知らないお店が候補に出てくる',
    detail: '周辺の行ったことがない店が提案されるので、次はどこへ行くか考えるのが楽しみになりました。'
  },
  {
    title: 'URLを探す手間がなくなった',
    detail: '一度ブックマークしておけば翌朝も同じURLで回答できるので、「今日のリンクどこ？」と探す必要がなくなりました。'
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
              チャットでみんなの予定を追いかけたり、スプレッドシートに人数をまとめたり——そんなバラバラの作業をまとめるために昼食さんを作りました。
              URLをひとつ共有すれば、その日の参加メンバーも行きたいお店も投票結果も同じ画面で確認できます。
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

