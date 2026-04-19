import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fzmofjppjhitnbdlvagg.supabase.co',
      },
    ],
  },
  serverExternalPackages: ['@anthropic-ai/sdk'],
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
}

export default nextConfig
