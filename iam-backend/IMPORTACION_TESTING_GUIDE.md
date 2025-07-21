# 🧪 Guía Completa de Testing del Sistema de Importación

## 📋 Resumen

Esta guía proporciona instrucciones completas para testear el sistema de importación de datos implementado en el ERP SaaS. El sistema permite importar productos, proveedores y movimientos de inventario desde archivos Excel/CSV de manera asíncrona y segura.

## 🚀 Configuración Inicial

### 1. Setup Automático

```bash
# Ejecutar el setup automático
cd iam-backend
node scripts/test-importacion-setup.js
```

Este comando:
- ✅ Crea directorios necesarios
- ✅ Configura variables de entorno
- ✅ Verifica dependencias
- ✅ Crea archivos de ejemplo
- ✅ Genera scripts de testing

### 2. Configuración Manual

Si prefieres configurar manualmente:

```bash
# Crear directorios
mkdir -p uploads/test uploads/import uploads/plantillas logs

# Configurar variables de entorno
cp .env.example .env.test
# Editar .env.test con tus configuraciones
```

### 3. Variables de Entorno Requeridas

```env
# Configuración del servidor
API_URL=http://localhost:8080
TEST_TOKEN=tu_jwt_token_aqui
TIMEOUT=30000

# Configuración de Redis
REDIS_URL=redis://localhost:6379

# Configuración de base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/iam_db"
```

## 🧪 Tipos de Testing

### 1. Testing Automático

```bash
# Ejecutar todos los tests automáticamente
node scripts/test-importacion.js
```

**Características:**
- ✅ Crea archivos de prueba automáticamente
- ✅ Prueba todos los endpoints
- ✅ Valida importaciones completas
- ✅ Genera reportes de resultados
- ✅ Testing de validaciones

### 2. Testing Manual Interactivo

```bash
# Testing interactivo con menú
node scripts/test-importacion-manual.js
```

**Opciones disponibles:**
1. 📋 Descargar plantillas
2. 📦 Probar importación de productos
3. 🏢 Probar importación de proveedores
4. 📊 Probar importación de movimientos
5. 📋 Gestionar trabajos
6. 🔍 Probar validaciones
7. 📁 Crear archivos de prueba
8. 🔧 Configurar token
9. 📊 Ver estado del servidor

### 3. Testing Rápido

```bash
# Testing rápido para desarrollo
node scripts/test-rapido.js
```

## 📊 Endpoints a Probar

### Plantillas

```bash
# Descargar plantillas
GET /importacion/plantillas/productos
GET /importacion/plantillas/proveedores
GET /importacion/plantillas/movimientos
GET /importacion/plantillas
```

### Importación

```bash
# Importar datos
POST /importacion/productos
POST /importacion/proveedores
POST /importacion/movimientos
```

### Gestión de Trabajos

```bash
# Gestionar trabajos
GET /importacion/trabajos
GET /importacion/trabajos/:id
DELETE /importacion/trabajos/:id
GET /importacion/trabajos/:id/errores
```

## 📁 Estructura de Archivos de Prueba

### Productos (productos_test.xlsx)

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| nombre | string | ✅ | max 100 chars |
| descripcion | string | ❌ | max 500 chars |
| codigo | string | ✅ | único por empresa |
| stock | number | ✅ | >= 0 |
| stock_minimo | number | ❌ | >= 0 |
| precio_compra | number | ✅ | > 0 |
| precio_venta | number | ✅ | > precio_compra |
| categoria | string | ❌ | max 50 chars |
| proveedor | string | ❌ | max 100 chars |
| ubicacion | string | ❌ | max 100 chars |
| tipo_producto | enum | ❌ | GENERICO/MEDICAMENTO/INSUMO |
| unidad | enum | ❌ | UNIDAD/TABLETA/ML/GRAMO |
| etiquetas | string | ❌ | max 10 tags |

### Proveedores (proveedores_test.xlsx)

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| nombre | string | ✅ | max 100 chars |
| ruc | string | ✅ | 11 dígitos |
| direccion | string | ❌ | max 200 chars |
| telefono | string | ❌ | formato válido |
| email | string | ❌ | formato válido |
| contacto_principal | string | ❌ | max 100 chars |
| telefono_contacto | string | ❌ | formato válido |
| email_contacto | string | ❌ | formato válido |
| categoria | string | ❌ | max 50 chars |
| condiciones_pago | string | ❌ | max 50 chars |
| estado | enum | ❌ | ACTIVO/INACTIVO |

### Movimientos (movimientos_test.xlsx)

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| tipo_movimiento | enum | ✅ | ENTRADA/SALIDA/AJUSTE |
| producto_codigo | string | ✅ | producto debe existir |
| cantidad | number | ✅ | > 0 |
| fecha_movimiento | date | ✅ | fecha válida |
| motivo | string | ❌ | max 100 chars |
| proveedor | string | ❌ | max 100 chars |
| cliente | string | ❌ | max 100 chars |
| lote | string | ❌ | max 50 chars |
| fecha_vencimiento | date | ❌ | fecha válida |
| precio_unitario | number | ❌ | > 0 |
| observaciones | string | ❌ | max 500 chars |

## 🔍 Casos de Prueba

### 1. Casos Exitosos

#### Productos Válidos
```excel
nombre,codigo,stock,precio_compra,precio_venta
Paracetamol 500mg,PARA500,150,0.50,1.20
Ibuprofeno 400mg,IBUP400,80,0.75,1.80
```

#### Proveedores Válidos
```excel
nombre,ruc,email,telefono
Farmacéutica ABC,20123456789,contacto@abc.com,+51 1 234 5678
```

#### Movimientos Válidos
```excel
tipo_movimiento,producto_codigo,cantidad,fecha_movimiento
ENTRADA,PARA500,50,2024-01-15
SALIDA,PARA500,10,2024-01-16
```

### 2. Casos de Error

#### Productos con Errores
```excel
nombre,codigo,stock,precio_compra,precio_venta
,INVALID,-5,no_numero,0
```

#### Proveedores con Errores
```excel
nombre,ruc,email,telefono
,123,email_invalido,telefono_invalido
```

#### Movimientos con Errores
```excel
tipo_movimiento,producto_codigo,cantidad,fecha_movimiento
INVALIDO,PRODUCTO_INEXISTENTE,-10,2024-13-45
```

## 📈 Monitoreo de Trabajos

### Estados de Trabajo

- **PENDIENTE**: Trabajo creado, esperando procesamiento
- **PROCESANDO**: Trabajo en ejecución
- **COMPLETADO**: Trabajo finalizado exitosamente
- **ERROR**: Trabajo falló con errores
- **CANCELADO**: Trabajo cancelado por el usuario

### Monitoreo en Tiempo Real

```bash
# Ver estado de trabajo específico
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/trabajos/TRABAJO_ID

# Listar todos los trabajos
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/trabajos
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Servidor No Responde
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:8080/health

# Verificar puerto
lsof -i :8080
```

#### 2. Redis No Conecta
```bash
# Verificar Redis
redis-cli ping

# Verificar configuración
echo $REDIS_URL
```

#### 3. Token Inválido
```bash
# Obtener nuevo token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"password"}'
```

#### 4. Archivo Muy Grande
```bash
# Verificar límite de archivo
# Por defecto: 50MB
# Configurar en .env: MAX_FILE_SIZE=52428800
```

#### 5. Errores de Validación
```bash
# Descargar reporte de errores
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/trabajos/TRABAJO_ID/errores \
  -o errores.xlsx
```

### Logs de Debug

```bash
# Ver logs del servidor
tail -f logs/app.log

# Ver logs de Redis
redis-cli monitor

# Ver logs de colas
# Los logs aparecen en la consola del servidor
```

## 📊 Métricas de Performance

### Objetivos de Performance

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Tiempo de respuesta | < 2s | - |
| Throughput | > 100 req/min | - |
| Tasa de éxito | > 95% | - |
| Tiempo de procesamiento | < 30s/1000 registros | - |

### Monitoreo de Métricas

```bash
# Ver estadísticas de colas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/stats

# Ver métricas de Redis
redis-cli info memory
redis-cli info stats
```

## 🔒 Seguridad

### Validaciones de Seguridad

- ✅ Validación de empresa por usuario
- ✅ Límites de tamaño de archivo
- ✅ Validación de tipos MIME
- ✅ Sanitización de datos
- ✅ Rate limiting
- ✅ Logging de auditoría

### Testing de Seguridad

```bash
# Probar sin token
curl http://localhost:8080/importacion/productos

# Probar con token inválido
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:8080/importacion/productos

# Probar archivo malicioso
# Crear archivo con extensión .exe pero contenido Excel
```

## 📝 Reportes

### Tipos de Reporte

1. **Reporte de Éxito**: Estadísticas de importación exitosa
2. **Reporte de Errores**: Detalle de errores por fila
3. **Reporte de Validación**: Errores de validación
4. **Reporte de Performance**: Métricas de rendimiento

### Generar Reportes

```bash
# Descargar reporte de errores
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/trabajos/TRABAJO_ID/errores \
  -o reporte_errores.xlsx

# Ver estadísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/importacion/trabajos/TRABAJO_ID
```

## 🚀 Integración Continua

### Scripts de CI/CD

```yaml
# .github/workflows/test-importacion.yml
name: Test Importación
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run import tests
        run: node scripts/test-importacion.js
        env:
          API_URL: ${{ secrets.API_URL }}
          TEST_TOKEN: ${{ secrets.TEST_TOKEN }}
```

### Testing Automatizado

```bash
# Ejecutar en pipeline
npm run test:importacion

# Verificar cobertura
npm run test:importacion:coverage
```

## 📚 Recursos Adicionales

### Documentación

- [API Documentation](./API_DOCUMENTATION.md)
- [Error Codes](./ERROR_CODES.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)

### Herramientas

- [Postman Collection](./postman/importacion.postman_collection.json)
- [Insomnia Workspace](./insomnia/importacion.json)
- [Curl Scripts](./scripts/curl-examples.sh)

### Contacto

Para soporte técnico o preguntas sobre testing:
- 📧 Email: soporte@tuempresa.com
- 📱 Slack: #testing-importacion
- 📖 Wiki: [Testing Wiki](https://wiki.tuempresa.com/testing)

---

**Última actualización**: $(date)
**Versión**: 1.0.0
**Autor**: Sistema de Importación Team 