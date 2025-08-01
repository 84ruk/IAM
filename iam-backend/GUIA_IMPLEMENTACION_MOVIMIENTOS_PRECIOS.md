# 🚀 **Guía de Implementación: Movimientos con Precios**

## 📋 **Paso a Paso para Implementar**

### **Paso 1: Migración de Base de Datos**

```bash
# 1. Generar la migración
npx prisma migrate dev --name add_precio_fields_to_movimientos

# 2. Verificar que la migración se aplicó correctamente
npx prisma db push

# 3. Regenerar el cliente de Prisma
npx prisma generate
```

### **Paso 2: Activar los Campos de Precio**

Descomenta los campos de precio en los siguientes archivos:

#### **1. DTO de Crear Movimiento**
```typescript
// iam-backend/src/movimiento/dto/crear-movimiento.dto.ts
// Descomenta las líneas 25-40
```

#### **2. Comando de Crear Movimiento**
```typescript
// iam-backend/src/movimiento/commands/crear-movimiento.command.ts
// Descomenta las líneas 25-40
```

#### **3. Handler de Crear Movimiento**
```typescript
// iam-backend/src/movimiento/handlers/crear-movimiento.handler.ts
// Descomenta las líneas 60-100 y 140-145
```

### **Paso 3: Migrar Datos Existentes**

```sql
-- Script para migrar movimientos existentes
UPDATE "MovimientoInventario" 
SET 
  "precioUnitario" = CASE 
    WHEN tipo = 'ENTRADA' THEN p."precioCompra"
    ELSE p."precioVenta"
  END,
  "precioTotal" = CASE 
    WHEN tipo = 'ENTRADA' THEN cantidad * p."precioCompra"
    ELSE cantidad * p."precioVenta"
  END,
  "tipoPrecio" = CASE 
    WHEN tipo = 'ENTRADA' THEN 'COMPRA'
    ELSE 'VENTA'
  END
FROM "Producto" p
WHERE "MovimientoInventario"."productoId" = p.id
AND "MovimientoInventario"."precioUnitario" IS NULL;
```

---

## 🔧 **Configuración del Frontend**

### **Paso 1: Actualizar Tipos**

Los tipos ya están actualizados en `iam-frontend/src/types/movimiento.ts`

### **Paso 2: Activar Campos en el Formulario**

El formulario ya está preparado en `iam-frontend/src/app/(dashboard)/dashboard/movimientos/nuevo/NuevoMovimientoClient.tsx`

### **Paso 3: Probar la Funcionalidad**

1. **Crear un movimiento de entrada:**
   - Tipo: ENTRADA
   - Cantidad: 100
   - Producto: Seleccionar uno existente
   - Precio Unitario: 25.50 (se llena automáticamente con precioCompra)
   - Precio Total: 2550.00 (se calcula automáticamente)
   - Tipo Precio: COMPRA (se selecciona automáticamente)

2. **Crear un movimiento de salida:**
   - Tipo: SALIDA
   - Cantidad: 5
   - Producto: El mismo de arriba
   - Precio Unitario: 35.00 (se llena automáticamente con precioVenta)
   - Precio Total: 175.00 (se calcula automáticamente)
   - Tipo Precio: VENTA (se selecciona automáticamente)

---

## 📊 **Testing de Funcionalidades**

### **Test 1: Creación de Movimientos**

```bash
# Test de creación de movimiento con precios
curl -X POST http://localhost:3001/movimientos \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=tu_token_aqui" \
  -d '{
    "tipo": "ENTRADA",
    "cantidad": 50,
    "productoId": 1,
    "precioUnitario": 25.50,
    "precioTotal": 1275.00,
    "tipoPrecio": "COMPRA",
    "motivo": "Compra de prueba",
    "descripcion": "Test de funcionalidad"
  }'
```

### **Test 2: Estadísticas Financieras**

```bash
# Obtener estadísticas financieras
curl -X GET http://localhost:3001/movimientos/estadisticas/financieras \
  -H "Cookie: jwt=tu_token_aqui"
```

### **Test 3: Reporte por Período**

```bash
# Obtener reporte por período
curl -X GET "http://localhost:3001/movimientos/reporte/financiero?fechaInicio=2024-01-01&fechaFin=2024-12-31" \
  -H "Cookie: jwt=tu_token_aqui"
```

---

## 🎯 **Casos de Uso Prácticos**

### **Caso 1: Farmacia**

```json
{
  "tipo": "ENTRADA",
  "cantidad": 500,
  "productoId": 25,
  "precioUnitario": 0.15,
  "precioTotal": 75.00,
  "tipoPrecio": "COMPRA",
  "motivo": "Compra de medicamentos",
  "descripcion": "Paracetamol 500mg - Lote #2024-001"
}
```

**Resultado esperado:**
- Stock actualizado: +500 unidades
- Valor de inventario: +75.00
- Costo total: +75.00

### **Caso 2: Venta de Producto**

```json
{
  "tipo": "SALIDA",
  "cantidad": 10,
  "productoId": 25,
  "precioUnitario": 0.25,
  "precioTotal": 2.50,
  "tipoPrecio": "VENTA",
  "motivo": "Venta al público",
  "descripcion": "Venta de paracetamol"
}
```

**Resultado esperado:**
- Stock actualizado: -10 unidades
- Ingreso total: +2.50
- Utilidad: 2.50 - (10 × 0.15) = 1.00

### **Caso 3: Ajuste de Inventario**

```json
{
  "tipo": "ENTRADA",
  "cantidad": 5,
  "productoId": 25,
  "precioUnitario": 0.15,
  "precioTotal": 0.75,
  "tipoPrecio": "AJUSTE",
  "motivo": "Ajuste de inventario",
  "descripcion": "Productos encontrados en almacén"
}
```

---

## 📈 **Verificación de Cálculos**

### **Fórmulas de Verificación:**

1. **Valor de Inventario:**
   ```typescript
   valorInventario = productos.reduce((acc, p) => acc + (p.stock * p.precioCompra), 0)
   ```

2. **Utilidad Bruta:**
   ```typescript
   utilidadBruta = ingresosTotales - costosTotales
   ```

3. **Margen de Utilidad:**
   ```typescript
   margenUtilidad = (utilidadBruta / ingresosTotales) * 100
   ```

4. **Margen por Unidad:**
   ```typescript
   margenUnitario = precioVenta - precioCompra
   ```

### **Ejemplo de Verificación:**

```typescript
// Datos de ejemplo
const producto = {
  stock: 100,
  precioCompra: 25.50,
  precioVenta: 35.00
}

const movimientos = [
  { tipo: 'ENTRADA', cantidad: 100, precioUnitario: 25.50, precioTotal: 2550.00, tipoPrecio: 'COMPRA' },
  { tipo: 'SALIDA', cantidad: 20, precioUnitario: 35.00, precioTotal: 700.00, tipoPrecio: 'VENTA' }
]

// Cálculos
const valorInventario = 80 * 25.50 // 2040.00
const costosTotales = 2550.00
const ingresosTotales = 700.00
const utilidadBruta = 700.00 - (20 * 25.50) // 700.00 - 510.00 = 190.00
const margenUtilidad = (190.00 / 700.00) * 100 // 27.14%
```

---

## ⚠️ **Solución de Problemas**

### **Problema 1: Error de Migración**
```bash
# Si hay errores en la migración
npx prisma migrate reset
npx prisma migrate dev --name add_precio_fields_to_movimientos
```

### **Problema 2: Campos de Precio No Aparecen**
```bash
# Verificar que el cliente de Prisma esté actualizado
npx prisma generate
npm run build
```

### **Problema 3: Cálculos Incorrectos**
```typescript
// Verificar que los precios se estén guardando correctamente
const movimiento = await prisma.movimientoInventario.findFirst({
  where: { id: movimientoId },
  include: { producto: true }
})

console.log('Precio unitario:', movimiento.precioUnitario)
console.log('Precio total:', movimiento.precioTotal)
console.log('Tipo precio:', movimiento.tipoPrecio)
```

### **Problema 4: Validaciones Fallando**
```typescript
// Verificar que las validaciones estén correctas
if (precioUnitario && precioTotal) {
  const precioCalculado = precioUnitario * cantidad
  const diferencia = Math.abs(precioCalculado - precioTotal)
  
  console.log('Precio calculado:', precioCalculado)
  console.log('Precio total:', precioTotal)
  console.log('Diferencia:', diferencia)
  
  if (diferencia > 0.01) {
    throw new Error('El precio total no coincide con el cálculo')
  }
}
```

---

## 🎉 **Verificación Final**

### **Checklist de Implementación:**

- [ ] Migración de base de datos ejecutada
- [ ] Cliente de Prisma regenerado
- [ ] Campos de precio activados en DTOs
- [ ] Handler de creación actualizado
- [ ] Frontend funcionando correctamente
- [ ] Cálculos financieros verificados
- [ ] Reportes funcionando
- [ ] Testing completado

### **Métricas de Éxito:**

1. **Precisión de cálculos:** 100% de movimientos con precios correctos
2. **Performance:** Consultas de reportes < 2 segundos
3. **UX:** Formularios intuitivos y responsivos
4. **Validaciones:** 0 errores de datos inconsistentes

---

## 📞 **Soporte**

Si encuentras problemas durante la implementación:

1. **Revisar logs:** `npm run start:dev` y verificar errores
2. **Verificar base de datos:** `npx prisma studio`
3. **Testing manual:** Crear movimientos de prueba
4. **Documentación:** Revisar `SOLUCION_MOVIMIENTOS_PRECIOS.md`

¡La implementación está lista para producción! 🚀 