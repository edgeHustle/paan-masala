/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUSINESS_NAME: process.env.BUSINESS_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
    DATABSE_NAME: process.env.DATABSE_NAME,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  },
  serverExternalPackages: ['mongodb'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'blob.v0.dev'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blob.v0.dev',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
