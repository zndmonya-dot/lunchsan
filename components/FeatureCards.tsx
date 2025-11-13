'use client'

export default function FeatureCards() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-5 md:gap-8">
          {/* Card 1: Easy Creation */}
          <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
            <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center mb-5 shadow-sm">
              <i className="ri-bowl-fill text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">カンタン作成</h3>
            <p className="text-sm text-gray-600 leading-relaxed">30秒で予定作成。面倒な設定は一切なし</p>
          </div>

          {/* Card 2: Schedule Adjustment */}
          <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
            <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center mb-5 shadow-sm">
              <i className="ri-group-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">参加確認</h3>
            <p className="text-sm text-gray-600 leading-relaxed">誰が参加できるか一目瞭然。リアルタイムで確認できます</p>
          </div>

          {/* Card 3: Restaurant Selection */}
          <div className="bg-white rounded-2xl p-7 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
            <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center mb-5 shadow-sm">
              <i className="ri-restaurant-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">お店選び</h3>
            <p className="text-sm text-gray-600 leading-relaxed">位置情報から最適な店を提案。投票で決めよう</p>
          </div>
        </div>
      </div>
    </section>
  )
}

