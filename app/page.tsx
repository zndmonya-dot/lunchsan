import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import HighlightsSection from '@/components/HighlightsSection'
import CreateEventForm from '@/components/CreateEventForm'
import UsageGuide from '@/components/UsageGuide'
import FAQ from '@/components/FAQ'
import SuccessStories from '@/components/SuccessStories'
import ProductUpdates from '@/components/ProductUpdates'
import AdPlaceholder from '@/components/AdPlaceholder'
import Footer from '@/components/Footer'

export default async function HomePage() {
  // 予定一覧は削除しました
  // イベントはトークン（URL）を知っている人だけがアクセスできます
  // これにより、プライバシーを保護し、調整さん方式の動作を実現します

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header>
        <Header />
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Highlights - 機能の紹介 */}
        <HighlightsSection />

        {/* Success Stories */}
        <SuccessStories />

        {/* Usage Guide - 使い方 */}
        <section id="usage-guide" className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16 md:py-20 scroll-mt-24" aria-labelledby="usage-guide-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <UsageGuide />
          </div>
        </section>

        <ProductUpdates />

        {/* Create Event Form - 実際に使ってみる */}
        <section id="create-form" className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 md:py-20 scroll-mt-24" aria-labelledby="create-form-heading">
          <CreateEventForm />
        </section>

        {/* Ad Placeholder Section */}
        <section className="bg-white py-12 sm:py-16 md:py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-8">
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-[0.2em] mb-3">
                Advertisement Plan
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">掲載予定の広告枠</h2>
              <p className="text-gray-700 leading-relaxed">
                Google AdSense による広告を、ユーザー体験を損なわない位置に配置します。以下はプレースホルダーであり、審査通過後に実際の広告が自動的に差し込まれます。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <AdPlaceholder title="ヒーロー直下（レスポンシブ）" description="ファーストビュー下部の横長広告枠です。" />
              <AdPlaceholder title="コンテンツ内（レクタングル）" description="Success Stories と FAQ の間に表示します。" />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-gray-50 py-12 sm:py-16 md:py-20 scroll-mt-24" aria-labelledby="faq-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FAQ />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <Footer />
      </footer>
    </div>
  )
}
