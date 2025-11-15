'use client'

const steps = [
  {
    number: 1,
    title: '予定を作る',
    icon: 'ri-edit-line',
    description: '日付や時間、ちょっとしたメモとお店候補を入力すれば完了'
  },
  {
    number: 2,
    title: 'URLを送る',
    icon: 'ri-share-line',
    description: 'できあがったURLをLINEやSlackにぺたっと貼るだけ'
  },
  {
    number: 3,
    title: '回答する',
    icon: 'ri-checkbox-circle-line',
    description: '参加できるかを選んで、気になるお店に投票するだけ'
  }
]

const situations = [
  {
    icon: 'ri-time-line',
    title: '毎日の定例ランチ',
    description: '毎朝0時にリセット。常連メンバーはブックマークしたURLを開くだけです'
  },
  {
    icon: 'ri-restaurant-line',
    title: 'お店を決めるとき',
    description: '近くのお店を自動で提案してくれるから、「どこにする？」で迷いません'
  },
  {
    icon: 'ri-shield-check-line',
    title: '社内＆友人の集まり',
    description: 'ログインやアカウント作成は不要。名前とメールだけで気軽に始められます'
  },
  {
    icon: 'ri-map-pin-line',
    title: '場所を悩みたくない',
    description: '現在地や手入力で候補をストックしておけば、気になるお店をメモ代わりに残せます'
  }
]

export default function UsageGuide() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl text-white shadow-lg mb-4 sm:mb-5">
          <i className="ri-book-open-line text-xl sm:text-2xl"></i>
        </div>
        <p className="text-xs font-semibold text-orange-600 tracking-widest uppercase mb-2 sm:mb-3">HOW IT WORKS</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">3ステップで予定調整完了</h2>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
          招待から投票まで、ひとつのURLであっという間。難しい説明はいりません。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-10 sm:mb-14">
        {steps.map((step) => (
          <div
            key={step.number}
            className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-orange-100 shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-xl text-xl sm:text-2xl font-bold mb-5 sm:mb-6 mx-auto shadow-lg">
              {step.number}
            </div>
            <div className="flex justify-center mb-5 sm:mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <i className={`${step.icon} text-orange-600 text-3xl sm:text-4xl`}></i>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center group-hover:text-orange-600 transition-colors">{step.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-orange-100 shadow-lg">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">こんなときに便利</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {situations.map((item) => (
            <div key={item.title} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-orange-600 text-lg sm:text-xl`}></i>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm sm:text-base mb-1.5 sm:mb-2">{item.title}</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="#create-form"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-orange-600 text-white text-sm sm:text-base font-bold hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl min-h-[48px] touch-manipulation"
          >
            予定を作成する
            <i className="ri-arrow-right-line text-base sm:text-lg"></i>
          </a>
        </div>
      </div>
    </div>
  )
}
