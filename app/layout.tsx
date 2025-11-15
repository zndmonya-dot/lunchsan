import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import HashScrollHandler from "./hash-scroll-handler";
import "./globals.css";
import "remixicon/fonts/remixicon.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunchsan.com";
const defaultTitle = "昼食さん - お昼ごはん調整アプリ";
const defaultDescription =
  "お昼ごはんの予定をみんなで簡単に調整。URLを送るだけで、誰が行ける？どこに行く？をカンタンに決められます。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | 昼食さん",
  },
  description: defaultDescription,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl,
    siteName: "昼食さん",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: `${siteUrl}/icon-192.png`,
        width: 192,
        height: 192,
        alt: "昼食さんロゴ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/icon-192.png`],
  },
  manifest: "/manifest.json",
  themeColor: "#f97316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "昼食さん",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script
          id="adsense-script"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4335284954366086"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HashScrollHandler />
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
            strategy="lazyOnload"
          />
        )}
        {children}
      </body>
    </html>
  );
}
