# Mejores Prácticas para Importar Filtros en NestJS

## 🎯 **Configuración Recomendada**

### **1. Configuración Centralizada (Actual)**

```typescript
// src/config/filters.config.ts
import { DatabaseExceptionFilter } from '../common/filters/database-exception.filter';
import { JwtExceptionFilter } from '../common/filters/jwt-exception.filter';

export const globalFilters = [
  new DatabaseExceptionFilter(),
  new JwtExceptionFilter(),
];
```

```typescript
// src/main.ts
import { globalFilters } from './config/filters.config';

app.useGlobalFilters(...globalFilters);
```

**✅ Ventajas:**
- Configuración centralizada y reutilizable
- Fácil mantenimiento y modificación
- Orden de ejecución claro y documentado
- Separación de responsabilidades

## 📁 **Estructura de Importaciones Recomendada**

### **Estructura de Carpetas:**
```
src/
├── config/
│   ├── filters.config.ts          # Configuración de filtros
│   ├── database.config.ts         # Configuración de DB
│   └── app.config.ts              # Configuración general
├── common/
│   ├── filters/
│   │   ├── database-exception.filter.ts
│   │   └── jwt-exception.filter.ts
│   └── exceptions/
│       └── business-exceptions.ts
└── main.ts
```

### **Orden de Importaciones en main.ts:**
```typescript
// 1. Imports de NestJS
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// 2. Imports de la aplicación
import { AppModule } from './app.module';

// 3. Imports de configuración
import { globalFilters } from './config/filters.config';
import { databaseConfig } from './config/database.config';

// 4. Imports de middleware externos
import * as cookieParser from 'cookie-parser';
```

## 🔧 **Diferentes Niveles de Configuración**

### **1. Nivel Global (Recomendado para la mayoría de casos)**
```typescript
// src/main.ts
app.useGlobalFilters(...globalFilters);
```

### **2. Nivel de Módulo (Para casos específicos)**
```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtExceptionFilter } from '../common/filters/jwt-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: JwtExceptionFilter,
    },
  ],
})
export class AuthModule {}
```

### **3. Nivel de Controlador (Para casos muy específicos)**
```typescript
// src/productos/producto.controller.ts
import { Controller, UseFilters } from '@nestjs/common';
import { DatabaseExceptionFilter } from '../common/filters/database-exception.filter';

@Controller('productos')
@UseFilters(DatabaseExceptionFilter)
export class ProductoController {}
```

### **4. Nivel de Método (Para casos extremadamente específicos)**
```typescript
// src/productos/producto.controller.ts
import { Controller, Get, UseFilters } from '@nestjs/common';
import { DatabaseExceptionFilter } from '../common/filters/database-exception.filter';

@Controller('productos')
export class ProductoController {
  
  @Get(':id')
  @UseFilters(DatabaseExceptionFilter)
  async findOne(@Param('id') id: string) {}
}
```

## 🚀 **Configuración Avanzada**

### **Filtros Condicionales:**
```typescript
// src/config/filters.config.ts
import { DatabaseExceptionFilter } from '../common/filters/database-exception.filter';
import { JwtExceptionFilter } from '../common/filters/jwt-exception.filter';

export const getGlobalFilters = (environment: string) => {
  const baseFilters = [new DatabaseExceptionFilter()];
  
  if (environment === 'production') {
    baseFilters.push(new JwtExceptionFilter());
  }
  
  return baseFilters;
};
```

### **Filtros con Configuración:**
```typescript
// src/config/filters.config.ts
export const globalFilters = [
  new DatabaseExceptionFilter({
    logErrors: process.env.NODE_ENV === 'development',
    includeStack: process.env.NODE_ENV === 'development',
  }),
  new JwtExceptionFilter({
    secret: process.env.JWT_SECRET,
  }),
];
```

## 📋 **Checklist de Mejores Prácticas**

### **✅ Importaciones:**
- [ ] Usar rutas relativas desde `src/`
- [ ] Agrupar imports por tipo (NestJS, aplicación, configuración, externos)
- [ ] Usar configuración centralizada cuando sea posible
- [ ] Documentar el orden de ejecución de filtros

### **✅ Configuración:**
- [ ] Configurar filtros globales en `main.ts`
- [ ] Usar archivos de configuración separados
- [ ] Mantener orden de ejecución consistente
- [ ] Probar diferentes escenarios de error

### **✅ Mantenimiento:**
- [ ] Revisar filtros regularmente
- [ ] Actualizar documentación cuando se agreguen nuevos filtros
- [ ] Probar filtros en diferentes entornos
- [ ] Monitorear logs de errores

## 🔍 **Verificación de Configuración**

### **1. Verificar Orden de Ejecución:**
```typescript
// Agregar logs temporales para verificar orden
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log('🔍 DatabaseExceptionFilter ejecutándose...');
    // ... resto del código
  }
}
```

### **2. Verificar Configuración:**
```bash
# Verificar que los filtros se cargan correctamente
docker-compose logs backend | grep "Filter"
```

### **3. Probar Diferentes Errores:**
```bash
# Error de base de datos
curl http://localhost:3000/dashboard/stock-chart

# Error de JWT
curl http://localhost:3000/productos/1

# Error de validación
curl -X POST http://localhost:3000/productos \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

## 🛠️ **Troubleshooting**

### **Problema: Filtro no se ejecuta**
**Solución:**
1. Verificar que esté en la configuración global
2. Verificar el orden de los filtros
3. Verificar que la excepción se esté lanzando correctamente

### **Problema: Múltiples filtros en conflicto**
**Solución:**
1. Revisar el orden de ejecución
2. Asegurar que solo un filtro maneje cada tipo de error
3. Usar configuración centralizada

### **Problema: Imports circulares**
**Solución:**
1. Revisar las dependencias entre módulos
2. Usar inyección de dependencias cuando sea posible
3. Separar la configuración en archivos independientes

## 📚 **Ejemplos de Configuración**

### **Configuración Mínima:**
```typescript
// src/main.ts
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

app.useGlobalFilters(new DatabaseExceptionFilter());
```

### **Configuración Completa:**
```typescript
// src/config/filters.config.ts
export const globalFilters = [
  new DatabaseExceptionFilter(),
  new JwtExceptionFilter(),
  new ValidationExceptionFilter(),
  new BusinessExceptionFilter(),
];

// src/main.ts
import { globalFilters } from './config/filters.config';
app.useGlobalFilters(...globalFilters);
```

### **Configuración por Entorno:**
```typescript
// src/config/filters.config.ts
export const getFiltersForEnvironment = (env: string) => {
  const filters = [new DatabaseExceptionFilter()];
  
  if (env === 'production') {
    filters.push(new SecurityExceptionFilter());
  }
  
  if (env === 'development') {
    filters.push(new DebugExceptionFilter());
  }
  
  return filters;
};
``` 