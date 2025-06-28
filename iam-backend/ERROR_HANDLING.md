# Manejo de Errores en el Backend

## 📋 **Resumen**

Este documento describe el sistema de manejo de errores implementado en el backend de IAM, incluyendo filtros de excepciones, excepciones de negocio personalizadas y manejo robusto de errores de base de datos.

## 🎯 **Filtros de Excepciones**

### **DatabaseExceptionFilter**
- **Ubicación**: `src/common/filters/database-exception.filter.ts`
- **Propósito**: Maneja errores de base de datos y excepciones de negocio
- **Configuración**: Global en `main.ts`

### **JwtExceptionFilter**
- **Ubicación**: `src/common/filters/jwt-exception.filter.ts`
- **Propósito**: Maneja errores de autenticación JWT
- **Configuración**: Global en `main.ts`

## 🚨 **Excepciones de Negocio**

### **InsufficientStockException**
```typescript
throw new InsufficientStockException(productoId, stockActual, cantidadSolicitada, productoNombre);
```
- **Código**: `INSUFFICIENT_STOCK`
- **Uso**: Cuando no hay suficiente stock para una salida
- **Sugerencia**: "Verifica el stock disponible antes de realizar la salida"

### **ProductNotFoundException**
```typescript
throw new ProductNotFoundException(productoId);
throw new ProductNotFoundException(undefined, codigoBarras);
```
- **Código**: `PRODUCT_NOT_FOUND`
- **Uso**: Cuando un producto no existe
- **Sugerencia**: "Verifica que el producto exista y esté activo"

### **InvalidMovementException**
```typescript
throw new InvalidMovementException(tipo, motivo);
```
- **Código**: `INVALID_MOVEMENT`
- **Uso**: Cuando un movimiento de inventario es inválido
- **Sugerencia**: "Verifica los datos del movimiento"

### **DuplicateProductException**
```typescript
throw new DuplicateProductException(field, value);
```
- **Código**: `DUPLICATE_PRODUCT`
- **Uso**: Cuando se intenta crear un producto duplicado
- **Sugerencia**: "Verifica que el producto no exista ya en el sistema"

### **InvalidProviderException**
```typescript
throw new InvalidProviderException(providerId, empresaId);
```
- **Código**: `INVALID_PROVIDER`
- **Uso**: Cuando un proveedor no existe o no pertenece a la empresa
- **Sugerencia**: "Verifica que el proveedor esté registrado en tu empresa"

### **InsufficientPermissionsException**
```typescript
throw new InsufficientPermissionsException(requiredRole, currentRole, action);
```
- **Código**: `INSUFFICIENT_PERMISSIONS`
- **Uso**: Cuando un usuario no tiene permisos suficientes
- **Sugerencia**: "Se requiere rol [ROL] para realizar esta acción"

## 🔧 **Servicios con Manejo de Errores**

### **ProductoService**
- **Métodos principales**:
  - `create()` - Crear producto con validación de proveedor y duplicados
  - `findAll()` - Listar productos activos
  - `findInactive()` - Listar productos inactivos
  - `findOne()` - Buscar producto por ID
  - `buscarPorCodigoBarras()` - Buscar producto por código de barras
  - `update()` - Actualizar producto con validaciones
  - `deactivate()` - Desactivar producto (soft delete)
  - `reactivate()` - Reactivar producto inactivo
  - `remove()` - Eliminar permanentemente (solo admins)

- **Validaciones implementadas**:
  - Existencia de producto
  - Validación de proveedor
  - Prevención de duplicados
  - Verificación de permisos para eliminación permanente
  - Validación de estado (activo/inactivo)

### **MovimientoService**
- **Validaciones implementadas**:
  - Stock suficiente para salidas
  - Existencia de producto
  - Validación de tipo de movimiento
  - Verificación de datos requeridos

### **DashboardService**
- **Manejo robusto de errores**:
  - Conexión a base de datos
  - Datos faltantes
  - Errores de cálculo
  - Timeouts de consultas

## 📊 **Endpoints de Productos**

### **Operaciones Básicas**
```http
GET /productos                    # Listar productos activos
GET /productos/inactivos          # Listar productos inactivos
GET /productos/:id                # Obtener producto por ID
GET /productos/buscar/:codigoBarras # Buscar por código de barras
POST /productos                   # Crear producto (solo ADMIN)
PATCH /productos/:id              # Actualizar producto (solo ADMIN)
```

### **Operaciones de Estado**
```http
DELETE /productos/:id             # Desactivar producto (soft delete)
PATCH /productos/:id/reactivar    # Reactivar producto (solo ADMIN)
DELETE /productos/:id/permanent   # Eliminar permanentemente (solo ADMIN/SUPERADMIN)
```

### **Flujo de Soft Delete**
1. **Usuario normal** usa `DELETE /productos/:id` → Marca como inactivo
2. **Admin** puede reactivar con `PATCH /productos/:id/reactivar`
3. **Admin/SUPERADMIN** puede eliminar permanentemente con `DELETE /productos/:id/permanent`

## 🔍 **Verificación de Errores**

### **Scripts de Prueba Disponibles**

1. **test-error-handling.js** - Pruebas generales de manejo de errores
2. **test-business-errors.js** - Pruebas específicas de errores de negocio
3. **test-product-deletion.js** - Pruebas del sistema de soft delete
4. **test-producto-operations.js** - Pruebas completas de operaciones de productos

### **Ejecutar Pruebas**
```bash
# Pruebas generales
node test-error-handling.js

# Pruebas de errores de negocio
node test-business-errors.js

# Pruebas de eliminación de productos
node test-product-deletion.js

# Pruebas completas de productos
node test-producto-operations.js
```

## 📝 **Logs y Monitoreo**

### **Logging Automático**
- Todos los errores se loggean automáticamente
- Incluye contexto del usuario y empresa
- Detalles técnicos para debugging
- Sugerencias de solución

### **Verificar Logs**
```bash
# Ver logs del backend
docker-compose logs backend

# Ver logs en tiempo real
docker-compose logs -f backend

# Filtrar por errores
docker-compose logs backend | grep "ERROR"
```

## 🛠️ **Troubleshooting**

### **Error de Base de Datos**
```json
{
  "statusCode": 503,
  "message": "La base de datos no está disponible. Verifica que el servicio esté ejecutándose.",
  "details": {
    "code": "DATABASE_UNAVAILABLE",
    "suggestion": "Verifica que Docker esté ejecutándose y reinicia los contenedores"
  }
}
```

### **Stock Insuficiente**
```json
{
  "statusCode": 400,
  "message": "Stock insuficiente para \"Fresa con leche\". Stock actual: 5, cantidad solicitada: 10",
  "details": {
    "code": "INSUFFICIENT_STOCK",
    "suggestion": "Verifica el stock disponible antes de realizar la salida",
    "productoId": 1,
    "stockActual": 5,
    "cantidadSolicitada": 10,
    "deficit": 5
  }
}
```

### **Permisos Insuficientes**
```json
{
  "statusCode": 403,
  "message": "No tienes permisos suficientes para eliminar productos permanentemente",
  "details": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "suggestion": "Se requiere rol ADMIN para realizar esta acción",
    "requiredRole": "ADMIN",
    "currentRole": "USER",
    "action": "eliminar productos permanentemente"
  }
}
```

## 🔄 **Actualizaciones Recientes**

### **v1.4 - Sistema de Soft Delete**
- ✅ Implementado soft delete para productos
- ✅ Endpoints diferenciados para desactivar/reactivar/eliminar
- ✅ Validación de permisos por rol
- ✅ Nuevas excepciones para permisos insuficientes

### **v1.3 - Errores de Negocio**
- ✅ Excepciones personalizadas para reglas de negocio
- ✅ Mensajes claros en español
- ✅ Sugerencias de solución
- ✅ Logging detallado

### **v1.2 - Manejo de Base de Datos**
- ✅ Filtro global para errores de DB
- ✅ Endpoint de salud para verificar estado
- ✅ Manejo robusto de timeouts y conexiones
- ✅ Respuestas claras para el frontend

### **v1.1 - Configuración Inicial**
- ✅ Filtros de excepciones básicos
- ✅ Manejo de errores JWT
- ✅ Validación de datos
- ✅ Logging básico 