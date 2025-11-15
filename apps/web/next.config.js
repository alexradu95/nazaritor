/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/schemas', '@repo/types'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
