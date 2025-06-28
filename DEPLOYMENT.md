# 🚀 Guía de Despliegue - IAM System

## 📋 Requisitos Previos

- **Docker** (versión 20.10 o superior)
- **Docker Compose** (versión 2.0 o superior)
- **Git** (para clonar el repositorio)

## 🎯 Opciones de Despliegue

### 1. **Despliegue Local con Docker (Recomendado para desarrollo)**

#### Opción A: Script Automatizado
```bash
# Ejecutar el script de despliegue
./deploy.sh
```

#### Opción B: Manual
```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd Proyecto\ IAM

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 3. Construir e iniciar servicios
docker-compose up -d --build

# 4. Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma generate
```

### 2. **Despliegue en la Nube**

#### **Vercel (Frontend)**
1. Conectar tu repositorio a Vercel
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_API_URL`: URL de tu backend
3. Desplegar automáticamente

#### **Railway (Backend)**
1. Conectar tu repositorio a Railway
2. Configurar variables de entorno:
   - `DATABASE_URL`: URL de tu base de datos
   - `JWT_SECRET`: Clave secreta para JWT
3. Desplegar automáticamente

#### **Heroku**
```bash
# Backend
heroku create iam-backend
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=tu_jwt_secret
git push heroku main

# Frontend
heroku create iam-frontend
heroku config:set NEXT_PUBLIC_API_URL=https://iam-backend.herokuapp.com
git push heroku main
```

## 🔧 Configuración de Variables de Entorno

### Backend (.env)
```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/base_datos"

# JWT
JWT_SECRET="tu_clave_secreta_muy_segura"

# Servidor
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL="https://tu-frontend.com"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://tu-backend.com"
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Verificar estado de servicios
```bash
docker-compose ps
```

## 🔄 Comandos Útiles

### Gestión de Contenedores
```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reconstruir imágenes
docker-compose build --no-cache
```

### Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Generar cliente Prisma
docker-compose exec backend npx prisma generate

# Abrir Prisma Studio
docker-compose exec backend npx prisma studio
```

### Backups
```bash
# Crear backup de la base de datos
docker-compose exec postgres pg_dump -U iam_user iam_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -T postgres psql -U iam_user iam_db < backup.sql
```

## 🛡️ Seguridad en Producción

### Variables de Entorno Críticas
- ✅ Cambiar `JWT_SECRET` por una clave segura
- ✅ Cambiar credenciales de base de datos
- ✅ Configurar HTTPS
- ✅ Configurar CORS correctamente

### Firewall y Redes
- ✅ Exponer solo puertos necesarios
- ✅ Configurar reglas de firewall
- ✅ Usar redes Docker aisladas

### Monitoreo
- ✅ Configurar logs centralizados
- ✅ Monitorear uso de recursos
- ✅ Configurar alertas

## 🚨 Solución de Problemas

### Backend no inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar variables de entorno
docker-compose exec backend env | grep DATABASE_URL

# Verificar conectividad a base de datos
docker-compose exec backend npx prisma db push
```

### Frontend no conecta con backend
```bash
# Verificar variable NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# Verificar CORS en backend
curl -H "Origin: http://localhost:3000" http://localhost:3001/health
```

### Base de datos no responde
```bash
# Verificar estado del contenedor
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Conectar manualmente
docker-compose exec postgres psql -U iam_user -d iam_db
```

## 📈 Escalabilidad

### Horizontal Scaling
```bash
# Escalar backend
docker-compose up -d --scale backend=3

# Escalar frontend
docker-compose up -d --scale frontend=2
```

### Load Balancer
```yaml
# Agregar nginx como load balancer
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - backend
    - frontend
```

## 🎉 ¡Despliegue Exitoso!

Una vez completado el despliegue, podrás acceder a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentación API**: http://localhost:3001/api

### Próximos Pasos
1. ✅ Configurar dominio personalizado
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar monitoreo
4. ✅ Configurar backups automáticos
5. ✅ Configurar CI/CD pipeline

---

**¿Necesitas ayuda?** Revisa los logs o consulta la documentación de cada servicio. 