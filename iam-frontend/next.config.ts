import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Mejorar el manejo de hidratación
  reactStrictMode: true,
  // Configuración adicional para estabilidad
  poweredByHeader: false,
  // Configuración para mejorar el manejo de chunks
  webpack: (config, { dev, isServer }) => {
    // Optimización para recharts en desarrollo
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              chunks: 'all',
              priority: 10,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }

    // Configuración para mejorar el manejo de errores
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Configuración para mejorar la estabilidad de chunks
    config.output = {
      ...config.output,
      chunkFilename: dev 
        ? 'static/chunks/[name].[chunkhash].js'
        : 'static/chunks/[name].[contenthash].js',
    };
    
    return config;
  },
  // Configuración para mejorar la estabilidad de Turbopack
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
