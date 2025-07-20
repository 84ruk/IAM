# 📊 Datos Necesarios para el Dashboard de Movimientos Diarios

## 🎯 **Resumen Ejecutivo**

El sistema de **Movimientos de Inventario Diarios** requiere los siguientes datos para funcionar completamente:

### ✅ **Datos Implementados**
- ✅ Endpoint `/dashboard-cqrs/daily-movements` - Funcionando
- ✅ Endpoint `/dashboard-cqrs/filter-options` - **NUEVO** (recién implementado)
- ✅ Componentes UI del frontend - Completos
- ✅ Hooks y lógica de filtros - Optimizados

### 🔧 **Datos que Faltan para Funcionar**

## 1. **Datos de Base de Datos**

### **Empresa**
```sql
-- Al menos una empresa debe existir
INSERT INTO "Empresa" (id, nombre, rfc, emailContacto, direccion, "TipoIndustria") 
VALUES (1, 'Empresa de Prueba', 'TEST123456789', 'test@empresa.com', 'Dirección de prueba', 'FARMACIA');
```

### **Usuarios**
```sql
-- Usuarios para autenticación y filtros
INSERT INTO "Usuario" (nombre, email, password, rol, "empresaId", activo) VALUES
('Administrador', 'admin@test.com', '$2b$10$test', 'ADMIN', 1, true),
('Empleado', 'empleado@test.com', '$2b$10$test', 'EMPLEADO', 1, true);
```

### **Proveedores**
```sql
-- Proveedores para filtros
INSERT INTO "Proveedor" (nombre, email, telefono, "empresaId", estado) VALUES
('Proveedor A', 'proveedorA@test.com', '555-0001', 1, 'ACTIVO'),
('Proveedor B', 'proveedorB@test.com', '555-0002', 1, 'ACTIVO');
```

### **Productos**
```sql
-- Productos con etiquetas para filtros
INSERT INTO "Producto" (nombre, descripcion, stock, "empresaId", "proveedorId", "precioCompra", "precioVenta", "stockMinimo", "tipoProducto", unidad, estado, etiquetas) VALUES
('Paracetamol 500mg', 'Analgésico y antipirético', 150, 1, 1, 2.50, 5.00, 20, 'MEDICAMENTO', 'CAJA', 'ACTIVO', ARRAY['Analgésico', 'Farmacia', 'Venta Libre']),
('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 80, 1, 1, 3.00, 6.50, 15, 'MEDICAMENTO', 'CAJA', 'ACTIVO', ARRAY['Antiinflamatorio', 'Farmacia', 'Venta Libre']),
('Jeringa 5ml', 'Jeringa desechable 5ml', 200, 1, 2, 1.50, 3.00, 50, 'INSUMO', 'PIEZA', 'ACTIVO', ARRAY['Insumo', 'Desechable', 'Uso Médico']),
('Guantes Látex M', 'Guantes de látex talla M', 25, 1, 2, 0.80, 1.80, 100, 'INSUMO', 'PIEZA', 'ACTIVO', ARRAY['Insumo', 'Desechable', 'Protección']);
```

### **Movimientos de Inventario**
```sql
-- Movimientos de los últimos 30 días para generar datos de gráficas
-- Se necesitan al menos 60-120 movimientos distribuidos en los últimos 30 días
-- Con diferentes tipos: ENTRADA, SALIDA
-- Con diferentes motivos: Compra, Venta, Ajuste, Devolución, Transferencia
```

## 2. **Script de Generación de Datos**

### **Ejecutar el script de datos de prueba:**
```bash
cd iam-backend
node scripts/generate-test-data.js
```

Este script creará automáticamente:
- ✅ 1 Empresa
- ✅ 2 Usuarios (Admin + Empleado)
- ✅ 2 Proveedores
- ✅ 4 Productos con etiquetas
- ✅ ~90 Movimientos (últimos 30 días)
- ✅ 2 Pedidos

## 3. **Endpoints Requeridos**

### **✅ Implementados:**
- `GET /dashboard-cqrs/daily-movements` - Datos de movimientos diarios
- `GET /dashboard-cqrs/filter-options` - Opciones de filtro dinámicas

### **📋 Respuesta Esperada de `/dashboard-cqrs/daily-movements`:**
```json
{
  "data": [
    {
      "fecha": "2024-01-15",
      "entradas": 45,
      "salidas": 32,
      "neto": 13,
      "valorEntradas": 1250.50,
      "valorSalidas": 890.25,
      "valorNeto": 360.25
    }
  ],
  "summary": {
    "avgEntradasDiarias": 42.3,
    "avgSalidasDiarias": 38.7,
    "diaMaxActividad": "2024-01-15",
    "totalMovimientos": 77,
    "tendencia": "CRECIENTE"
  },
  "meta": {
    "empresaId": 1,
    "source": "cqrs",
    "generatedAt": "2024-01-15T10:30:00Z",
    "daysRequested": 7,
    "totalDays": 7
  }
}
```

### **📋 Respuesta Esperada de `/dashboard-cqrs/filter-options`:**
```json
{
  "products": [
    { "value": "1", "label": "Paracetamol 500mg", "count": 0 },
    { "value": "2", "label": "Ibuprofeno 400mg", "count": 0 }
  ],
  "suppliers": [
    { "value": "1", "label": "Proveedor A", "count": 0 },
    { "value": "2", "label": "Proveedor B", "count": 0 }
  ],
  "categories": [
    { "value": "Analgésico", "label": "Analgésico", "count": 0 },
    { "value": "Farmacia", "label": "Farmacia", "count": 0 }
  ],
  "tags": [
    { "value": "Analgésico", "label": "Analgésico", "count": 0 },
    { "value": "Farmacia", "label": "Farmacia", "count": 0 }
  ],
  "reasons": [
    { "value": "Compra", "label": "Compra", "count": 0 },
    { "value": "Venta", "label": "Venta", "count": 0 }
  ],
  "users": [
    { "value": "1", "label": "Administrador", "count": 0 },
    { "value": "2", "label": "Empleado", "count": 0 }
  ],
  "dateRanges": [
    { "value": "7d", "label": "Últimos 7 días", "count": 0 },
    { "value": "30d", "label": "Últimos 30 días", "count": 0 }
  ]
}
```

## 4. **Pasos para Implementar**

### **Paso 1: Generar Datos de Prueba**
```bash
cd iam-backend
node scripts/generate-test-data.js
```

### **Paso 2: Verificar Backend**
```bash
cd iam-backend
npm run start:dev
```

### **Paso 3: Probar Endpoints**
```bash
# Con autenticación JWT válida
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/dashboard-cqrs/daily-movements?days=7

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/dashboard-cqrs/filter-options
```

### **Paso 4: Verificar Frontend**
```bash
cd iam-frontend
npm run dev
```

## 5. **Datos Mínimos Requeridos**

### **Para que funcione el dashboard básico:**
- ✅ 1 Empresa
- ✅ 1 Usuario (cualquier rol)
- ✅ 1 Producto
- ✅ 1 Proveedor
- ✅ 10+ Movimientos (últimos 7 días)

### **Para que funcionen todos los filtros:**
- ✅ 2+ Productos con diferentes etiquetas
- ✅ 2+ Proveedores
- ✅ 2+ Usuarios
- ✅ 30+ Movimientos con diferentes motivos
- ✅ Movimientos distribuidos en varios días

## 6. **Verificación de Funcionamiento**

### **Indicadores de éxito:**
1. ✅ El endpoint `/dashboard-cqrs/filter-options` responde con datos
2. ✅ El endpoint `/dashboard-cqrs/daily-movements` responde con datos
3. ✅ El frontend carga sin errores
4. ✅ Los filtros muestran opciones
5. ✅ Las gráficas se renderizan con datos
6. ✅ Los presets funcionan correctamente

### **Comandos de verificación:**
```bash
# Verificar que el backend responde
curl -X GET http://localhost:3000/health

# Verificar que la base de datos tiene datos
cd iam-backend
npx prisma studio
```

## 🎉 **Conclusión**

Una vez que se ejecute el script `generate-test-data.js`, el sistema estará completamente funcional con:

- ✅ **Backend**: Endpoints implementados y funcionando
- ✅ **Frontend**: Componentes optimizados y sin errores
- ✅ **Datos**: Información de prueba realista
- ✅ **Filtros**: Sistema completo de filtros avanzados
- ✅ **Gráficas**: Visualización de datos interactiva

**¡El sistema estará listo para usar!** 🚀 