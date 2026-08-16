import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/app/i18n/index.ts");

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
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    domains: [
      "res.cloudinary.com",
      "aiartshop.com",
      "th.bing.com",
      "i.ibb.co",
      "drive.google.com",
      "lh3.googleusercontent.com",
      "docs.google.com",
      "api.qrserver.com",
    ],
  },
};

export default withNextIntl(nextConfig);
