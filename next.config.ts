import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // モダンブラウザのみをターゲット（ポリフィル削減）
  transpilePackages: [],
  compiler: {
    // 不要なconsole.logを削除（本番環境）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 実験的機能: 最適化
  experimental: {
    optimizePackageImports: ['remixicon'],
  },
  // webpack設定: remixiconのフォントファイルを正しく処理
  webpack: (config) => {
    // remixiconのフォントファイルを正しく処理
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      type: 'asset/resource',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://pagead2.googlesyndication.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://api.open-meteo.com https://api.bigdatacloud.net https://api.openweathermap.org https://*.google.com https://*.googlesyndication.com https://*.googleadservices.com https://ep1.adtrafficquality.google",
              "frame-src 'self' https://maps.googleapis.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'"
            ].join('; ')
          }
        ],
      },
      // 静的リソースのキャッシュ設定
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
