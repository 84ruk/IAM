#!/bin/bash

echo "🔧 Configurando base de datos local para desarrollo..."

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

echo "🐳 Iniciando PostgreSQL con Docker..."

# Crear archivo docker-compose.yml si no existe
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: iam-postgres
    environment:
      POSTGRES_DB: iam_db
      POSTGRES_USER: iam_user
      POSTGRES_PASSWORD: iam_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: iam-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
EOF
    echo "✅ Archivo docker-compose.yml creado"
fi

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

# Verificar que PostgreSQL esté funcionando
if docker-compose ps | grep -q "Up"; then
    echo "✅ Servicios iniciados correctamente"
else
    echo "❌ Error al iniciar servicios"
    exit 1
fi

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Configuración local para desarrollo
DATABASE_URL="postgresql://iam_user:iam_password@localhost:5432/iam_db"
DIRECT_URL="postgresql://iam_user:iam_password@localhost:5432/iam_db"

# JWT
JWT_SECRET="ASjgfgRMznJu9kHzbdsoqXXCfh99PTrQEFxO9VgfethW+J6EYmWnFOqgPGI+nzX9qM8Yls1vzCPV66PQB/JFxQ=="
JWT_EXPIRES_IN="7d"
JWT_ISSUER="http://localhost:3001"
JWT_AUDIENCE="http://localhost:3001"

# Servidor
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="debug"
AUTH_AUDIT_ENABLED=true

# Seguridad
JWT_CLOCK_TOLERANCE=30
JWT_STRICT_VALIDATION=true
EOF
    echo "✅ Archivo .env.local creado"
fi

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copia .env.local a .env en el directorio iam-backend"
echo "2. Ejecuta las migraciones: cd iam-backend && npx prisma migrate deploy"
echo "3. Genera el cliente Prisma: npx prisma generate"
echo "4. Inicia el backend: npm run start:dev"
echo ""
echo "🔗 URLs de servicios:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🛑 Para detener: docker-compose down"
echo "🔄 Para reiniciar: docker-compose restart" 