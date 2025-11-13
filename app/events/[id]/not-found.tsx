import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-lg w-full">
          {/* 左上から始まる視線の流れに最適化 */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-md mb-6">
              <i className="ri-question-line text-white text-5xl"></i>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            予定が見つかりません
          </h1>
          <p className="text-gray-700 mb-8 text-base md:text-lg leading-relaxed">
            この予定は存在しないか、削除された可能性があります。
            <br />
            URLが正しいかご確認ください。
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="px-8 py-3.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-bold text-base shadow-sm hover:shadow-md min-h-[48px] flex items-center justify-center"
            >
              <i className="ri-home-line mr-2 text-lg"></i>
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}



