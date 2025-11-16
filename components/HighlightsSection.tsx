'use client'

const coreBenefits = [
  {
    title: '毎日同じURLでOK',
    description: '毎晩0時になると回答だけがリセット。ブックマークしたURLを毎朝そのまま開けます。',
    icon: 'ri-refresh-line'
  },
  {
    title: '参加状況がひと目でわかる',
    description: '誰が参加するか、誰が未定かがすぐに分かるから、声かけ忘れも防げます。',
    icon: 'ri-road-map-line'
  },
  {
    title: '近くのお店をその場で提案',
    description: '現在地や手入力から近所のお店をすぐ提案。候補探しで迷う時間がぐっと減ります。',
    icon: 'ri-restaurant-line'
  },
  {
    title: '投票でスムーズに決定',
    description: 'ワンクリック投票で得票順に並ぶので、みんなの好みが見えて決めやすくなります。',
    icon: 'ri-thumb-up-line'
  }
]


export default function HighlightsSection() {
  return (
    <section className="bg-gradient-to-b from-white to-orange-50/30 py-12 sm:py-16 md:py-20" id="features">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10 sm:mb-14 text-center">
          <p className="text-xs sm:text-sm font-semibold text-orange-600 mb-2 sm:mb-3">Lunchsan Highlights</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-5 px-2">
            ランチ調整に必要な機能がすべて揃っています
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            出欠確認からお店選びまで、ランチ調整に必要な機能をひとつにまとめました。毎日の定例ランチから、たまの集まりまで、どんなシーンでもスムーズに使えます。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {coreBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group rounded-2xl border-2 border-orange-100 bg-white p-5 sm:p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-orange-200 group-hover:to-orange-100 transition-colors">
                <i className={`${benefit.icon} text-xl sm:text-2xl`}></i>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{benefit.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

