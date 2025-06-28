# Uso de Filtros de Excepciones

## 📋 **Resumen**

Los filtros de excepciones en NestJS son interceptores que capturan excepciones lanzadas durante el procesamiento de una solicitud y las transforman en respuestas HTTP estructuradas.

## 🎯 **DatabaseExceptionFilter**

### **¿Qué hace?**
- Captura errores de base de datos (Prisma)
- Maneja errores de negocio personalizados
- Proporciona mensajes claros en español
- Incluye sugerencias de solución
- Logging detallado para debugging

### **Tipos de Errores que Maneja**
- Errores de conexión a base de datos
- Errores de validación de Prisma
- Excepciones de negocio personalizadas
- Errores de permisos
- Errores generales de JavaScript

## 🔧 **Opciones de Configuración**

### 1. **Configuración Global** (Recomendado)
```typescript
// main.ts
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aplica el filtro a toda la aplicación
  app.useGlobalFilters(new DatabaseExceptionFilter());
  
  await app.listen(3000);
}
```

**Ventajas:**
- ✅ Se aplica automáticamente a todos los controladores
- ✅ No necesitas decorar cada controlador
- ✅ Manejo consistente de errores en toda la app
- ✅ Fácil mantenimiento

### 2. **Configuración por Controlador**
```typescript
@Controller('productos')
@UseFilters(DatabaseExceptionFilter)
export class ProductoController {
  // Todos los métodos de este controlador usan el filtro
}
```

### 3. **Configuración por Método**
```typescript
@Controller('productos')
export class ProductoController {
  
  @Get(':id')
  @UseFilters(DatabaseExceptionFilter)
  async findOne(@Param('id') id: string) {
    // Solo este método usa el filtro
  }
}
```

## 📍 **Ubicación Actual**

En tu proyecto, el `DatabaseExceptionFilter` está configurado **globalmente** en:

```typescript
// src/main.ts
app.useGlobalFilters(new DatabaseExceptionFilter());
```

Esto significa que **todos los controladores** de tu aplicación ya están usando el filtro automáticamente.

## 🚀 **Cómo Funciona**

### **Flujo de Ejecución:**
1. **Cliente** hace una petición HTTP
2. **Controlador** procesa la petición
3. **Servicio** ejecuta la lógica de negocio
4. **Si hay error** → Se lanza una excepción
5. **DatabaseExceptionFilter** captura la excepción
6. **Filtro** transforma el error en respuesta estructurada
7. **Cliente** recibe respuesta de error clara

### **Ejemplo Práctico:**
```typescript
// 1. Cliente hace petición
GET /productos/999

// 2. Servicio lanza excepción
throw new ProductNotFoundException(999);

// 3. Filtro captura y transforma
{
  "statusCode": 404,
  "message": "Producto no encontrado con ID: 999",
  "details": {
    "code": "PRODUCT_NOT_FOUND",
    "suggestion": "Verifica que el producto exista y esté activo"
  }
}
```

## 🔍 **Verificación**

Para verificar que el filtro está funcionando:

### **1. Revisar Logs**
```bash
# Los errores se loggean automáticamente
docker-compose logs backend
```

### **2. Probar Endpoints**
```bash
# Probar con producto inexistente
curl http://localhost:3000/productos/999

# Probar con base de datos caída
docker-compose stop postgres
curl http://localhost:3000/dashboard/stock-chart
```

### **3. Verificar Respuestas**
Las respuestas de error deben tener esta estructura:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/productos/999",
  "method": "GET",
  "message": "Mensaje claro en español",
  "details": {
    "code": "CODIGO_ERROR",
    "suggestion": "Sugerencia de solución"
  }
}
```

## 🛠️ **Personalización**

### **Agregar Nuevos Tipos de Error:**
```typescript
// 1. Crear nueva excepción
export class CustomBusinessException extends BadRequestException {
  constructor(message: string) {
    super({
      message,
      details: {
        code: 'CUSTOM_ERROR',
        suggestion: 'Sugerencia personalizada'
      }
    });
  }
}

// 2. Agregar al filtro
if (exception instanceof CustomBusinessException) {
  status = HttpStatus.BAD_REQUEST;
  message = exception.message;
  details = exception.getResponse() as any;
}
```

### **Modificar Mensajes:**
```typescript
// En el filtro, puedes personalizar mensajes según el contexto
if (exception instanceof ProductNotFoundException) {
  message = `El producto ${exception.productoId} no fue encontrado`;
}
```

## 📚 **Mejores Prácticas**

### **✅ Hacer:**
- Usar configuración global para consistencia
- Lanzar excepciones específicas en servicios
- Incluir sugerencias útiles en los errores
- Loggear errores para debugging
- Probar diferentes escenarios de error

### **❌ Evitar:**
- Manejar errores manualmente en controladores
- Usar mensajes de error genéricos
- Exponer detalles internos en producción
- Ignorar el logging de errores

## 🔧 **Troubleshooting**

### **El filtro no se aplica:**
1. Verificar que esté importado en `main.ts`
2. Verificar que no haya otros filtros que lo sobrescriban
3. Verificar que la excepción se esté lanzando correctamente

### **Respuestas de error inconsistentes:**
1. Verificar que todas las excepciones extiendan de las clases base correctas
2. Verificar que el filtro maneje todos los tipos de excepción
3. Verificar que no haya múltiples filtros en conflicto

### **Logs no aparecen:**
1. Verificar configuración de logging en `main.ts`
2. Verificar que el nivel de log sea apropiado
3. Verificar que los logs se estén enviando al lugar correcto 