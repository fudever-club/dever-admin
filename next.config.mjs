import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/app/i18n/index.ts");
const apiServer = (process.env.NEXT_PUBLIC_API_SERVER ||
  "https://dever-backend-production.up.railway.app").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Closed allowlist (audited 2026-09-23): R2 proxy avatars/covers, Google
    // avatars, legacy i.ibb.co fallbacks, plus localhost for dev. New image
    // hosts must be added here or next/image returns 400 for them.
    remotePatterns: [
      { protocol: 'https', hostname: 'dever-backend-production.up.railway.app' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiServer}/api/v1/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${apiServer}/static/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
