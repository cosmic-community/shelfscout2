/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cosmicjs.com',
      },
      {
        protocol: 'https',
        hostname: 'imgix.cosmicjs.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Ensure TypeScript errors fail the build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Ensure ESLint errors fail the build
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig