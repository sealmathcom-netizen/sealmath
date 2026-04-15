import { MAX_ATTACHMENT_SIZE_MB } from './src/utils/shared-config.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: `${MAX_ATTACHMENT_SIZE_MB * 1.25}mb`,
    },
  },
  env: {
    MAX_ATTACHMENT_SIZE_MB: String(MAX_ATTACHMENT_SIZE_MB),
  },
}

export default nextConfig
