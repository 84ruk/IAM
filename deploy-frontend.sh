#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."

# Configurar variables de entorno para producción
echo "📝 Configurando variables de entorno..."
echo "NEXT_PUBLIC_API_URL=https://iam-backend-baruk.fly.dev" > .env.production

# Build del proyecto
echo "🔨 Building project..."
npm run build

# Deploy a Vercel
echo "🌐 Deploying to Vercel..."
echo "Si el deploy automático falla, puedes hacerlo manualmente desde:"
echo "https://vercel.com/84ruks-projects/iam-frontend"

# Intentar deploy automático
if command -v vercel &> /dev/null; then
    vercel --prod --yes
else
    echo "⚠️  Vercel CLI no encontrado. Instalando..."
    npm install -g vercel
    vercel --prod --yes
fi

echo "✅ Deploy completado!"
echo "🌍 Tu aplicación estará disponible en:"
echo "Frontend: https://iam-frontend.vercel.app"
echo "Backend: https://iam-backend-baruk.fly.dev" 