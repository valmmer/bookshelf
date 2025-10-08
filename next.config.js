/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário no Railway para rodar via `next start`
  output: 'standalone',

  // Permitir imagens remotas (para <Image />)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'http', hostname: 'localhost' },
      {
        protocol: 'https',
        hostname: 'snzsacdpnazpmmnznuyh.supabase.co', // 👈 sem "https://"
        pathname: '/storage/v1/object/public/**', // arquivos públicos do Storage
      },
    ],
  },

  // Mantemos desativados durante ajustes
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
