# Instrucciones Correctas para Ejecutar el Proyecto

## ❌ **Comando Incorrecto**
```bash
npm run start:dev  # ❌ Este comando NO existe
```

## ✅ **Comandos Correctos**

### 1. **Para ejecutar todo el proyecto (Backend + Frontend)**
```bash
npm run dev
```

### 2. **Para ejecutar solo el Backend**
```bash
npm run dev:backend
# o
cd iam-backend && npm run start:dev
```

### 3. **Para ejecutar solo el Frontend**
```bash
npm run dev:frontend
# o
cd iam-frontend && npm run dev
```

## 🔧 **Configuración Inicial**

### 1. **Instalar dependencias**
```bash
# Instalar todas las dependencias
npm run install:all

# O manualmente:
npm install
cd iam-backend && npm install
cd ../iam-frontend && npm install
```

### 2. **Configurar la base de datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Abrir Prisma Studio (opcional)
npm run db:studio
```

## 🚀 **Pasos para Ejecutar**

### **Opción 1: Ejecutar todo junto (Recomendado)**
```bash
# 1. Instalar dependencias
npm run install:all

# 2. Configurar base de datos
npm run db:generate
npm run db:migrate

# 3. Ejecutar todo el proyecto
npm run dev
```

### **Opción 2: Ejecutar por separado**
```bash
# Terminal 1 - Backend
cd iam-backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd iam-frontend
npm install
npm run dev
```

## 🌐 **URLs de Acceso**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

## 🔍 **Verificar que Funciona**

### 1. **Verificar Backend**
```bash
curl http://localhost:3001/health
# Debería responder con status 200
```

### 2. **Verificar Frontend**
- Abrir http://localhost:3000 en el navegador
- Debería cargar la página de login/dashboard

### 3. **Verificar Base de Datos**
```bash
npm run db:studio
# Debería abrir Prisma Studio en el navegador
```

## 🛠️ **Scripts Disponibles**

```bash
# Desarrollo
npm run dev                    # Ejecutar todo
npm run dev:backend           # Solo backend
npm run dev:frontend          # Solo frontend

# Construcción
npm run build                 # Construir todo
npm run build:backend         # Construir backend
npm run build:frontend        # Construir frontend

# Base de datos
npm run db:generate           # Generar cliente Prisma
npm run db:migrate            # Ejecutar migraciones
npm run db:studio             # Abrir Prisma Studio

# Linting
npm run lint                  # Lintear todo
npm run lint:backend          # Lintear backend
npm run lint:frontend         # Lintear frontend

# Instalación
npm run install:all           # Instalar todas las dependencias
```

## 🚨 **Solución al Error "Demasiadas solicitudes simultáneas"**

### **Problema:**
El error se produce porque múltiples componentes están haciendo requests simultáneos al backend.

### **Solución Implementada:**

1. **Rate Limiting en el Frontend**
   - Cliente API con throttling (100ms entre requests)
   - Retry automático con backoff exponencial
   - Manejo de errores 429 (Too Many Requests)

2. **Hook Lazy Loading**
   - Carga de datos solo cuando se necesitan
   - Inicialización única con Promise caching
   - Evita requests duplicados

3. **Manejo de Estados**
   - Estados de carga explícitos
   - Fallbacks para valores undefined
   - Optional chaining en todos los accesos

### **Uso del Hook Mejorado:**
```typescript
// En lugar del hook original
import { useImportacion } from '@/hooks/useImportacion'

// Usar el hook mejorado
import { useImportacionLazy } from '@/hooks/useImportacionLazy'

const {
  isLoading,
  isInitialized,
  trabajos,
  error,
  initializeData,
  forceLoad
} = useImportacionLazy()

// Inicializar cuando sea necesario
useEffect(() => {
  if (!isInitialized) {
    initializeData()
  }
}, [isInitialized, initializeData])
```

## 🔧 **Troubleshooting**

### **Error: "Cannot find module"**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
cd iam-backend && npm install
cd ../iam-frontend && npm install
```

### **Error: "Port already in use"**
```bash
# Encontrar y matar el proceso
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### **Error: "Database connection failed"**
```bash
# Verificar que la base de datos esté corriendo
# Para PostgreSQL:
brew services start postgresql

# Para MySQL:
brew services start mysql
```

### **Error: "Demasiadas solicitudes simultáneas"**
```bash
# 1. Usar el hook lazy loading
# 2. Verificar que no haya múltiples instancias del hook
# 3. Implementar rate limiting en el backend si es necesario
```

## 📞 **Contacto**

Si sigues teniendo problemas:

1. **Verificar logs del backend**: `cd iam-backend && npm run start:dev`
2. **Verificar logs del frontend**: `cd iam-frontend && npm run dev`
3. **Verificar conectividad**: `curl http://localhost:3001/health`
4. **Verificar base de datos**: `npm run db:studio` 