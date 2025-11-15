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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header>
        <Header />
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Highlights */}
        <HighlightsSection />

        {/* Create Event Form - トップ画面で直接作成 */}
        <section id="create-form" className="scroll-mt-24" aria-labelledby="create-form-heading">
          <CreateEventForm />
        </section>

        {/* Usage Guide */}
        <section id="usage-guide" className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16 md:py-20 scroll-mt-24" aria-labelledby="usage-guide-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <UsageGuide />
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-white py-12 sm:py-16 md:py-20 scroll-mt-24" aria-labelledby="faq-heading">
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
