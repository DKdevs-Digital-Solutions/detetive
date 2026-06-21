/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baileys e deps rodam só no servidor (API routes) — não empacotar no webpack.
  // Evita o congelamento de build visto com libs pesadas.
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino', 'qrcode'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
