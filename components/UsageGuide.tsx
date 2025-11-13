'use client'

export default function UsageGuide() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="mb-4">
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm inline-flex mx-auto">
            <i className="ri-book-open-line text-white text-xl"></i>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">使い方</h2>
        <p className="text-gray-700 text-base font-medium">簡単3ステップでお昼ごはんの予定を調整</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 md:gap-8 mb-12">
        {/* Step 1 */}
        <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
          <div className="flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-lg text-2xl font-bold mb-5 mx-auto shadow-sm">
            1
          </div>
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center shadow-sm">
              <i className="ri-edit-line text-orange-600 text-3xl"></i>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">予定を作る</h3>
          <p className="text-sm text-gray-600 text-center leading-relaxed font-medium">
            日付と時間を選んで<br />お昼ごはんの予定を作成
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
          <div className="flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-lg text-2xl font-bold mb-5 mx-auto shadow-sm">
            2
          </div>
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center shadow-sm">
              <i className="ri-share-line text-orange-600 text-3xl"></i>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">URLを送る</h3>
          <p className="text-sm text-gray-600 text-center leading-relaxed font-medium">
            作成したURLを<br />みんなに送るだけ
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
          <div className="flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-lg text-2xl font-bold mb-5 mx-auto shadow-sm">
            3
          </div>
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center shadow-sm">
              <i className="ri-checkbox-circle-line text-orange-600 text-3xl"></i>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">回答する</h3>
          <p className="text-sm text-gray-600 text-center leading-relaxed font-medium">
            ログイン不要で<br />参加・不参加を回答
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-5 text-center">こんなときに便利</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-orange-600 text-lg"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">毎日のお昼ごはん調整</p>
              <p className="text-xs text-gray-600 leading-relaxed">みんなで気軽にお昼ごはんの予定を調整</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-restaurant-line text-orange-600 text-lg"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">お店の投票機能</p>
              <p className="text-xs text-gray-600 leading-relaxed">近くのお店から選んで投票できる</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-shield-check-line text-orange-600 text-lg"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">ログイン不要</p>
              <p className="text-xs text-gray-600 leading-relaxed">参加者はログインなしで簡単に回答</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-map-pin-line text-orange-600 text-lg"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">位置情報から検索</p>
              <p className="text-xs text-gray-600 leading-relaxed">自動で近くのお店を検索して表示</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
