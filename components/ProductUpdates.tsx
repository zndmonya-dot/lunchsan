const updates = [
  {
    title: 'レストラン投票が匿名でも安全に',
    date: '2025/11/10',
    body: '投票時にニックネームと任意パスワードを保存できるようになり、参加者が後から投票を編集してもなりすましされない設計になりました。',
  },
  {
    title: 'Supabase 連携でデータを地域別に可視化',
    date: '2025/10/18',
    body: 'ダッシュボード機能のβ版を公開し、人気エリアや参加率をグラフで確認できます。イベントの改善にすぐ役立つフィードバックを得られます。',
  },
  {
    title: '飲食店アレルギータグを追加',
    date: '2025/09/30',
    body: '候補に含まれる食材アレルギー情報を登録でき、参加者ごとに注意喚起を表示。社内の総務チームから高評価をいただいています。',
  },
]

export default function ProductUpdates() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 md:py-20 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-10">
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">
            Product Journal
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            開発ログと最新アップデート
          </h2>
          <p className="text-gray-700 leading-relaxed">
            AdSense 審査向けに「運営が継続的に改善している」ことを可視化。プロダクトの更新履歴を公開し、読者にも価値ある情報を提供します。
          </p>
        </div>
        <div className="space-y-6">
          {updates.map((update) => (
            <article
              key={update.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <h3 className="text-xl font-bold text-gray-900">{update.title}</h3>
                <time className="text-sm font-semibold text-gray-500">{update.date}</time>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{update.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

