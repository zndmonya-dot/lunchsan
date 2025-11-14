import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import HighlightsSection from '@/components/HighlightsSection'
import CreateEventForm from '@/components/CreateEventForm'
import UsageGuide from '@/components/UsageGuide'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default async function HomePage() {
  // 予定一覧は削除しました
  // イベントはトークン（URL）を知っている人だけがアクセスできます
  // これにより、プライバシーを保護し、調整さん方式の動作を実現します

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Highlights */}
      <HighlightsSection />

      {/* Create Event Form - トップ画面で直接作成 */}
      <CreateEventForm />

      {/* Usage Guide */}
      <div id="usage-guide" className="bg-white py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <UsageGuide />
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-gray-50 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <FAQ />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
