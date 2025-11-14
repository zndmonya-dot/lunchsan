'use client'

const steps = [
  {
    number: 1,
    title: '予定を作る',
    icon: 'ri-edit-line',
    description: '日付と時間を決めて、集まりたい内容を入力'
  },
  {
    number: 2,
    title: 'URLを送る',
    icon: 'ri-share-line',
    description: '生成されたURLをLINEやSlackに貼って共有'
  },
  {
    number: 3,
    title: '回答する',
    icon: 'ri-checkbox-circle-line',
    description: '参加可否とコメントを入力。気になるお店があれば投票も'
  }
]

const situations = [
  {
    icon: 'ri-time-line',
    title: '毎日の定例ランチ',
    description: '自動リセットで常連メンバーも毎朝同じURLにアクセスするだけ'
  },
  {
    icon: 'ri-restaurant-line',
    title: 'お店を決めるとき',
    description: '位置情報から候補が出るので「どこ行く？」の沈黙を作らせません'
  },
  {
    icon: 'ri-shield-check-line',
    title: '社内＆友人の集まり',
    description: 'ログイン不要でゲストもサッと回答。メール登録だけでOK'
  },
  {
    icon: 'ri-map-pin-line',
    title: '場所を悩みたくない',
    description: '現在地や手入力から候補をストック。気に入った店を残しておけます'
  }
]

export default function UsageGuide() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-xl text-white shadow-sm mb-4">
          <i className="ri-book-open-line text-xl"></i>
        </div>
        <p className="text-xs font-semibold text-orange-600 tracking-widest uppercase mb-3">HOW IT WORKS</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">3ステップで予定調整完了</h2>
        <p className="text-base text-gray-600 font-medium">
          招待から投票まで、昼食さんならひとつのURLでスムーズにつながります。
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 md:gap-7 mb-12">
        {steps.map((step) => (
          <div
            key={step.number}
            className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-orange-600 text-white rounded-xl text-2xl font-bold mb-5 mx-auto shadow-sm">
              {step.number}
            </div>
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
                <i className={`${step.icon} text-orange-600 text-3xl`}></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
            <p className="text-sm text-gray-600 text-center leading-relaxed font-medium">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-5 text-center">こんなときに便利</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {situations.map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-200">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-orange-600 text-lg`}></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="#create-form"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors shadow-md"
          >
            予定を作成する
            <i className="ri-arrow-right-line text-base"></i>
          </a>
        </div>
      </div>
    </div>
  )
}
