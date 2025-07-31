import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Mejorar el manejo de hidratación
  reactStrictMode: true,
  // Configuración adicional para estabilidad
  poweredByHeader: false,
};

export default nextConfig;
