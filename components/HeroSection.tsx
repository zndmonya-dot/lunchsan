'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-orange-50 to-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-10">
          {/* 左上から始まるZパターン */}
          <div className="text-left mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="text-gray-900">
                お昼ごはんの予定
              </span>
              <br className="hidden sm:block" />
              <span className="text-orange-600 block mt-2 sm:mt-0">みんなで決めよう</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 max-w-3xl leading-relaxed font-medium">
              誰が行ける？どこに行く？
              <br className="hidden sm:block" />
              お昼ごはんの予定をカンタンに調整できます
            </p>
          </div>
          <div className="flex flex-wrap items-start justify-start gap-3 md:gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm border border-orange-200 min-h-[48px] hover:shadow-md hover:border-orange-300 transition-all">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="ri-check-line text-white text-base"></i>
              </div>
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">ログイン不要</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm border border-orange-200 min-h-[48px] hover:shadow-md hover:border-orange-300 transition-all">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="ri-flashlight-line text-white text-base"></i>
              </div>
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">簡単操作</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm border border-orange-200 min-h-[48px] hover:shadow-md hover:border-orange-300 transition-all">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="ri-time-line text-white text-base"></i>
              </div>
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">30秒で開始</span>
            </div>
          </div>
          {/* CTAボタン: 左下から右下への配置（Zパターンの最後） */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3">
            <a
              href="#create-form"
              className="group px-8 md:px-10 py-4 bg-orange-600 text-white rounded-xl font-semibold text-base hover:bg-orange-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 h-[48px] touch-manipulation transition-all"
            >
              今すぐ始める
              <i className="ri-arrow-right-line text-xl"></i>
            </a>
            <a
              href="#usage-guide"
              className="px-8 md:px-10 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold text-base hover:bg-orange-50 hover:border-orange-300 shadow-md hover:shadow-lg flex items-center justify-center h-[48px] touch-manipulation transition-all"
            >
              使い方を見る
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

