import { MAX_ATTACHMENT_SIZE_MB } from './src/utils/shared-config.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverActions: {
    bodySizeLimit: `${MAX_ATTACHMENT_SIZE_MB * 1.25}mb`,
  },
}

export default nextConfig
