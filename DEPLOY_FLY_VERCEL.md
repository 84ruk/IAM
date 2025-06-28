# 🚀 Despliegue IAM - Fly.io + Vercel

Este documento describe cómo desplegar el sistema IAM en Fly.io (Backend) y Vercel (Frontend).

## 📋 Prerrequisitos

### 1. Cuentas necesarias
- [Fly.io](https://fly.io/) - Para el backend
- [Vercel](https://vercel.com/) - Para el frontend
- [PostgreSQL](https://www.postgresql.org/) - Base de datos (puedes usar Fly Postgres, Railway, o Supabase)

### 2. Herramientas CLI
```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Instalar Vercel CLI
npm i -g vercel

# Verificar instalación
fly version
vercel --version
```

### 3. Variables de entorno necesarias
```bash
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@host:puerto/database"

# JWT Secret (generar uno seguro)
JWT_SECRET="tu-jwt-secret-super-seguro"

# URL del frontend (opcional)
FRONTEND_URL="https://tu-app.vercel.app"
```

## 🛠️ Configuración

### 1. Clonar y configurar el proyecto
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd Proyecto-IAM

# Cambiar a la rama de despliegue
git checkout deploy/fly-vercel

# Configurar variables de entorno
export DATABASE_URL="tu-database-url"
export JWT_SECRET="tu-jwt-secret"
export FRONTEND_URL="https://tu-app.vercel.app"
```

### 2. Configurar base de datos
```bash
# Si usas Fly Postgres
fly postgres create iam-database
fly postgres attach iam-database --app iam-backend

# Si usas Railway
# Crear proyecto en Railway y obtener DATABASE_URL

# Si usas Supabase
# Crear proyecto en Supabase y obtener DATABASE_URL
```

## 🚀 Despliegue Automático

### Opción 1: Script automatizado (Recomendado)
```bash
# Ejecutar script de despliegue
./deploy-fly-vercel.sh
```

### Opción 2: Despliegue manual

#### Backend en Fly.io
```bash
cd iam-backend

# Crear app en Fly.io
fly launch --no-deploy --name iam-backend

# Configurar variables de entorno
fly secrets set DATABASE_URL="$DATABASE_URL"
fly secrets set JWT_SECRET="$JWT_SECRET"
fly secrets set NODE_ENV="production"
fly secrets set FRONTEND_URL="$FRONTEND_URL"

# Desplegar
fly deploy

# Verificar estado
fly status
```

#### Frontend en Vercel
```bash
cd iam-frontend

# Configurar Vercel
vercel --yes

# Configurar variables de entorno en Vercel Dashboard
# NEXT_PUBLIC_API_URL: https://iam-backend.fly.dev

# Desplegar
vercel --prod
```

## 🔧 Configuración Post-Despliegue

### 1. Configurar CORS en el backend
```bash
# Actualizar FRONTEND_URL en Fly.io
fly secrets set FRONTEND_URL="https://tu-app.vercel.app"
```

### 2. Configurar variables en Vercel
```bash
# En el dashboard de Vercel, configurar:
NEXT_PUBLIC_API_URL=https://iam-backend.fly.dev
```

### 3. Ejecutar migraciones de base de datos
```bash
# Conectar a la app de Fly.io
fly ssh console -s

# Ejecutar migraciones
npx prisma migrate deploy
```

## 📊 Monitoreo y Logs

### Fly.io
```bash
# Ver logs del backend
fly logs -a iam-backend

# Ver estado de la app
fly status -a iam-backend

# Escalar la app
fly scale count 1 -a iam-backend
```

### Vercel
```bash
# Ver logs del frontend
vercel logs

# Ver estado del proyecto
vercel ls
```

## 🔒 Seguridad

### Variables de entorno sensibles
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Clave secreta para JWT
- `NODE_ENV`: Entorno de ejecución

### Configuraciones de seguridad
- CORS configurado para permitir solo el frontend
- JWT con expiración configurada
- Validación de datos en todos los endpoints
- Rate limiting configurado

## 🐛 Troubleshooting

### Problemas comunes

#### 1. Error de conexión a base de datos
```bash
# Verificar DATABASE_URL
fly secrets list -a iam-backend

# Probar conexión
fly ssh console -s
npx prisma db push
```

#### 2. Error de CORS
```bash
# Verificar FRONTEND_URL
fly secrets set FRONTEND_URL="https://tu-app.vercel.app"
fly deploy
```

#### 3. Error de build en Vercel
```bash
# Verificar variables de entorno
vercel env ls

# Reconstruir
vercel --force
```

#### 4. Error de puerto en Fly.io
```bash
# Verificar configuración
fly config show -a iam-backend

# Reiniciar app
fly restart -a iam-backend
```

## 📈 Escalabilidad

### Fly.io
- Auto-scaling configurado
- Múltiples regiones disponibles
- Load balancing automático

### Vercel
- Edge functions para mejor rendimiento
- CDN global
- Auto-scaling automático

## 🔄 Actualizaciones

### Desplegar actualizaciones
```bash
# Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin deploy/fly-vercel

# Desplegar automáticamente
./deploy-fly-vercel.sh
```

### Rollback
```bash
# Fly.io
fly deploy --image-label v1 -a iam-backend

# Vercel
vercel rollback
```

## 📞 Soporte

- **Fly.io**: [Documentación oficial](https://fly.io/docs/)
- **Vercel**: [Documentación oficial](https://vercel.com/docs)
- **Issues**: Crear issue en el repositorio del proyecto

---

**Autor**: Baruk Ramos  
**Fecha**: 2025-06-27  
**Versión**: 1.0.0 