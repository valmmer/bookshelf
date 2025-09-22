/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'http', hostname: 'localhost' }, // se usar em dev
    ],
  },
};
module.exports = nextConfig;
