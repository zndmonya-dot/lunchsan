const stories = [
  {
    title: '社内ランチ会が定例化',
    subtitle: 'IT スタートアップ / 20名規模',
    body: 'Slack に URL を貼るだけで 5 分以内に参加者が確定。候補の飲食店も投票で決められるため、毎週木曜のランチ会が定着しました。',
    metric: '回答率 93%',
  },
  {
    title: '新卒研修の交流促進',
    subtitle: '大手メーカー / 研修担当',
    body: '1 日 3 回のグループ替えを伴う研修で、各グループの食事調整に利用。メールアドレス不要なので研修生も安心して参加でき、アンケート満足度は 4.7 / 5 を記録。',
    metric: '工数 -60%',
  },
  {
    title: '地域コミュニティの食事会',
    subtitle: '自治体ボランティア',
    body: '高齢者向けサロンでの食事イベントの出欠確認に採用。紙の回覧からオンラインに切り替え、キャンセル把握やアレルギー管理がスムーズになりました。',
    metric: '準備時間 -2h',
  },
]

export default function SuccessStories() {
  return (
    <section className="bg-white py-12 sm:py-16 md:py-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-10">
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">
            Real Stories
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            導入チームの声と成果
          </h2>
          <p className="text-gray-700 leading-relaxed">
            昼食さんはベンチャー企業から地域コミュニティまで幅広く利用されています。具体的な活用シーンを公開し、初めての方でも使い方をイメージしやすくしました。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.title}
              className="h-full bg-gradient-to-b from-orange-50 via-white to-white border border-orange-100 rounded-2xl p-6 flex flex-col shadow-sm"
            >
              <div className="text-sm font-semibold text-orange-600 mb-2">{story.subtitle}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{story.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed flex-1">{story.body}</p>
              <div className="mt-6 text-sm font-semibold text-gray-900">
                <span className="text-2xl text-orange-600 mr-2">{story.metric}</span>達成
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

