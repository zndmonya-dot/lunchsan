import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'プライバシーポリシー - 昼食さん',
  description: '昼食さんのプライバシーポリシー',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 p-6 md:p-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="ri-shield-check-line text-white text-xl"></i>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
            </div>
            <p className="text-sm text-gray-600">最終更新日: 2025年1月10日</p>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. はじめに</h2>
              <p className="leading-relaxed">
                「昼食さん」（以下「本サービス」）は、ユーザーの個人情報の保護を重要な責務と考えています。本プライバシーポリシーは、本サービスがどのような個人情報を収集し、どのように利用・保護するかについて説明します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 収集する情報</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">2.1 ユーザーが提供する情報</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>名前:</strong> イベント作成時および参加時にご入力いただく名前</li>
                <li><strong>メールアドレス:</strong> イベント作成時および参加時にご入力いただくメールアドレス（参加状況の識別に使用）</li>
                <li><strong>位置情報:</strong> お店検索機能を使用する際に取得する位置情報（任意）</li>
                <li><strong>イベント情報:</strong> 作成するイベントの日付、時間、タイトル、説明、場所の候補などの情報</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">2.2 自動的に収集される情報</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>アクセスログ:</strong> 本サービスへのアクセス日時、IPアドレス、ブラウザの種類などの情報</li>
                <li><strong>Cookie:</strong> サービス改善のため、Cookieを使用する場合があります</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 情報の利用目的</h2>
              <p className="leading-relaxed mb-2">当社は、収集した個人情報を以下の目的で利用します。</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>本サービスの提供、運営、改善</li>
                <li>イベントの作成、管理、参加状況の管理</li>
                <li>お店検索機能の提供（位置情報を使用する場合）</li>
                <li>ユーザーからのお問い合わせへの対応</li>
                <li>本サービスの利用規約違反の防止</li>
                <li>本サービスの安全性向上、不正利用の防止</li>
                <li>統計データの作成（個人を特定できない形で）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 情報の共有と開示</h2>
              <p className="leading-relaxed mb-2">
                当社は、以下の場合を除き、ユーザーの個人情報を第三者に開示または提供することはありません。
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>本サービスの運営に必要な範囲で、業務委託先に提供する場合（個人情報保護に関する契約を締結した場合に限る）</li>
              </ul>
              <p className="leading-relaxed mt-4">
                <strong>注意:</strong> イベントの参加者には、他の参加者の名前のみが表示されます。メールアドレスなどの連絡先情報は表示されません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 情報の保存期間</h2>
              <p className="leading-relaxed">
                当社は、個人情報を利用目的の達成に必要な期間、または法令で定められた期間、保存します。イベント情報は、一定期間の経過後に当社が定期的に削除する場合があります（ユーザーが明示的に削除できる機能は提供していません）。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 個人情報の安全管理</h2>
              <p className="leading-relaxed">
                当社は、個人情報の紛失、破壊、改ざん、漏洩などを防止するため、セキュリティシステムの維持・管理体制の整備・社員教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. 個人情報の開示・訂正・削除</h2>
              <p className="leading-relaxed mb-2">
                ユーザーは、当社に対してご自身の個人情報の開示・訂正・削除を請求することができます。ただし、以下の場合は、開示を拒否することがあります。
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ユーザー本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                <li>その他法令に違反することとなる場合</li>
              </ul>
              <p className="leading-relaxed mt-4">
                個人情報の開示・訂正・削除のご請求は、<a href="/contact" className="text-orange-600 hover:text-orange-700 underline">お問い合わせ</a>ページからご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookie（クッキー）について</h2>
              <p className="leading-relaxed">
                本サービスは、サービス改善のため、Cookieを使用する場合があります。Cookieは、ユーザーのコンピュータに保存される小さなテキストファイルです。ブラウザの設定により、Cookieの受け入れを拒否することができますが、その場合、本サービスの一部機能が正常に動作しない可能性があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. 第三者サービス</h2>
              <p className="leading-relaxed mb-2">
                本サービスでは、以下の第三者サービスを利用しています。
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Google Places API:</strong> お店検索機能を提供するため、Google Places APIを使用しています。Googleのプライバシーポリシーについては、<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Googleのプライバシーポリシー</a>をご確認ください。</li>
                <li><strong>Supabase:</strong> データベースサービスとしてSupabaseを使用しています。Supabaseのプライバシーポリシーについては、<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Supabaseのプライバシーポリシー</a>をご確認ください。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. プライバシーポリシーの変更</h2>
              <p className="leading-relaxed">
                当社は、必要に応じて、本プライバシーポリシーの内容を変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. お問い合わせ</h2>
              <p className="leading-relaxed">
                本プライバシーポリシーに関するお問い合わせは、<a href="/contact" className="text-orange-600 hover:text-orange-700 underline">お問い合わせ</a>ページからご連絡ください。
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
            >
              <i className="ri-arrow-left-line"></i>
              トップページに戻る
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

