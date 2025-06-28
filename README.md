# 🏭 IAM System - Sistema de Inventario y Administración de Movimientos

Sistema completo de gestión de inventario con autenticación, roles de usuario, y administración de movimientos de stock.

## 🚀 Características Principales

- **🔐 Autenticación JWT** con roles (SUPERADMIN, ADMIN, EMPLEADO, PROVEEDOR)
- **📦 Gestión de Productos** con códigos de barras y soft delete
- **🔄 Movimientos de Inventario** con trazabilidad completa
- **👥 Gestión de Usuarios** con sistema de roles y permisos
- **🏢 Gestión de Empresas** multi-tenant
- **📊 Dashboard** con KPIs y análisis
- **🔍 Soft Delete** para todos los elementos
- **📱 Responsive Design** para móviles y desktop

## 🛡️ Seguridad

### **🔒 Protección de Credenciales**

Este proyecto implementa las mejores prácticas de seguridad:

- ✅ **Variables de entorno** para todas las credenciales
- ✅ **Archivos .env** excluidos del repositorio
- ✅ **Scripts de auditoría** de seguridad automatizados
- ✅ **Generación segura** de claves y contraseñas
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Rate limiting** para prevenir ataques
- ✅ **CORS configurado** correctamente

### **🔐 Gestión de Secretos**

```bash
# Generar credenciales seguras
./generate-secrets.sh

# Ejecutar auditoría de seguridad
./security-audit.sh
```

**📖 Ver [SECURITY.md](SECURITY.md) para la guía completa de seguridad.**

## 🏗️ Arquitectura

```
IAM System/
├── iam-backend/          # API REST con NestJS
│   ├── src/
│   │   ├── auth/         # Autenticación JWT
│   │   ├── admin/        # Administración de usuarios
│   │   ├── productos/    # Gestión de productos
│   │   ├── movimientos/  # Movimientos de inventario
│   │   ├── proveedores/  # Gestión de proveedores
│   │   └── dashboard/    # KPIs y análisis
│   └── prisma/           # ORM y migraciones
├── iam-frontend/         # Frontend con Next.js
│   ├── src/
│   │   ├── app/          # Páginas de la aplicación
│   │   ├── components/   # Componentes reutilizables
│   │   └── types/        # Tipos TypeScript
│   └── public/           # Archivos estáticos
└── scripts/              # Scripts de despliegue y seguridad
```

## 🚀 Inicio Rápido

### **Prerrequisitos**

- Node.js 18+
- PostgreSQL 15+
- Docker (opcional)

### **1. Clonar el repositorio**

```bash
git clone <tu-repositorio>
cd Proyecto\ IAM
```

### **2. Configurar credenciales**

```bash
# Generar credenciales seguras
./generate-secrets.sh

# Configurar variables de entorno
cp .env.generated .env
# Editar .env con tus configuraciones
```

### **3. Desplegar con Docker**

```bash
# Despliegue local
./deploy.sh

# O desplegar manualmente
docker-compose up -d --build
```

### **4. Verificar instalación**

```bash
# Ejecutar auditoría de seguridad
./security-audit.sh

# Verificar servicios
docker-compose ps
```

## 🔧 Configuración

### **Variables de Entorno**

Copia `env.example` a `.env` y configura:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/iam_db"

# JWT
JWT_SECRET="tu_clave_secreta_muy_larga"

# Servidor
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### **Base de Datos**

```bash
# Ejecutar migraciones
cd iam-backend
npx prisma migrate deploy
npx prisma generate
```

## 📊 Funcionalidades

### **🔐 Autenticación y Roles**

- **SUPERADMIN**: Acceso total al sistema
- **ADMIN**: Gestión de usuarios y configuración
- **EMPLEADO**: Operaciones de inventario
- **PROVEEDOR**: Acceso limitado a sus productos

### **📦 Gestión de Productos**

- Crear, editar, eliminar productos
- Códigos de barras únicos
- Categorías y etiquetas
- Soft delete con restauración
- Historial de cambios

### **🔄 Movimientos de Inventario**

- Entradas y salidas de stock
- Trazabilidad completa
- Asociación con proveedores
- Movimientos eliminados con restauración
- Búsqueda por código de barras

### **👥 Administración de Usuarios**

- CRUD completo de usuarios
- Gestión de roles y permisos
- Activación/desactivación
- Cambio de roles
- Soft delete

### **📊 Dashboard y Análisis**

- KPIs en tiempo real
- Gráficas de movimientos
- Stock crítico
- Alertas de inventario
- Predicciones de quiebre

## 🚀 Despliegue

### **Opciones de Despliegue**

1. **Local con Docker** (Recomendado para desarrollo)
   ```bash
   ./deploy.sh
   ```

2. **Vercel + Railway** (Gratuito)
   - Frontend: Vercel
   - Backend: Railway
   - Base de datos: PostgreSQL en Railway

3. **DigitalOcean** (Profesional)
   - Droplet: $5/mes
   - Base de datos: $15/mes

4. **AWS/Azure** (Empresarial)
   - EC2/Azure VM: $20-50/mes
   - RDS/Azure Database: $30-100/mes

### **Scripts de Despliegue**

```bash
# Desarrollo
./deploy.sh

# Producción
./deploy-production.sh

# Generar credenciales
./generate-secrets.sh

# Auditoría de seguridad
./security-audit.sh
```

**📖 Ver [DEPLOYMENT.md](DEPLOYMENT.md) para la guía completa de despliegue.**

## 🔒 Seguridad

### **Mejores Prácticas Implementadas**

- ✅ Variables de entorno para credenciales
- ✅ Validación de entrada en todos los endpoints
- ✅ Rate limiting para prevenir ataques
- ✅ CORS configurado correctamente
- ✅ Headers de seguridad
- ✅ Soft delete para auditoría
- ✅ Logs de seguridad
- ✅ Auditoría automatizada

### **Scripts de Seguridad**

```bash
# Generar credenciales seguras
./generate-secrets.sh

# Ejecutar auditoría completa
./security-audit.sh

# Verificar dependencias
npm audit
```

## 🧪 Testing

```bash
# Backend
cd iam-backend
npm run test
npm run test:e2e

# Frontend
cd iam-frontend
npm run test
```

## 📚 Documentación

- **[SECURITY.md](SECURITY.md)** - Guía completa de seguridad
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de despliegue
- **[RESUMEN_DESPLIEGUE.md](RESUMEN_DESPLIEGUE.md)** - Resumen ejecutivo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### **Estándares de Código**

- TypeScript para todo el código
- ESLint + Prettier para formato
- Commits semánticos
- Tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [SECURITY.md](SECURITY.md)
- **Issues**: GitHub Issues
- **Email**: soporte@tuempresa.com

## 🔄 Changelog

### **v1.0.0** (2025-01-27)
- ✅ Sistema completo de autenticación
- ✅ CRUD de productos con soft delete
- ✅ Movimientos de inventario
- ✅ Gestión de usuarios y roles
- ✅ Dashboard con KPIs
- ✅ Scripts de seguridad y despliegue
- ✅ Documentación completa

---

**🔒 Recuerda: La seguridad es prioridad. Siempre ejecuta la auditoría de seguridad antes de desplegar.**
