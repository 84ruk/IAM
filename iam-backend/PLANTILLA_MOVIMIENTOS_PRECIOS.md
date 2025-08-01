# 📊 **Plantilla: Movimientos con Tracking de Precios**

## 🎯 **Propósito**
Esta plantilla define la estructura y ejemplos de cómo deben ser los movimientos de inventario con tracking completo de precios para análisis financiero preciso.

---

## 📋 **Estructura de Datos**

### **Campos Base del Movimiento**
```typescript
interface MovimientoConPrecios {
  // ✅ Campos básicos
  id: number
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  productoId: number
  empresaId: number
  fecha: Date
  motivo?: string
  descripcion?: string
  estado: 'ACTIVO' | 'ELIMINADO'
  
  // ✅ NUEVO: Campos de precio para tracking financiero
  precioUnitario: number        // Precio por unidad en el momento del movimiento
  precioTotal: number          // Precio total del movimiento (cantidad * precioUnitario)
  tipoPrecio: 'COMPRA' | 'VENTA' | 'AJUSTE' | 'TRANSFERENCIA'
  
  // ✅ Relaciones
  producto: {
    id: number
    nombre: string
    precioCompra: number
    precioVenta: number
    stock: number
    unidad: string
  }
  proveedor?: {
    id: number
    nombre: string
  }
}
```

---

## 📝 **Ejemplos de Movimientos por Tipo**

### **1. Entrada por Compra (COMPRA)**
```json
{
  "id": 1,
  "tipo": "ENTRADA",
  "cantidad": 100,
  "productoId": 5,
  "empresaId": 1,
  "fecha": "2024-01-15T10:30:00Z",
  "motivo": "Compra a proveedor",
  "descripcion": "Compra mensual de materia prima",
  "estado": "ACTIVO",
  
  // ✅ Campos de precio
  "precioUnitario": 25.50,
  "precioTotal": 2550.00,
  "tipoPrecio": "COMPRA",
  
  "producto": {
    "id": 5,
    "nombre": "Laptop HP Pavilion",
    "precioCompra": 25.50,
    "precioVenta": 35.00,
    "stock": 150,
    "unidad": "UNIDAD"
  },
  "proveedor": {
    "id": 3,
    "nombre": "Tecnología Avanzada S.A."
  }
}
```

### **2. Salida por Venta (VENTA)**
```json
{
  "id": 2,
  "tipo": "SALIDA",
  "cantidad": 5,
  "productoId": 5,
  "empresaId": 1,
  "fecha": "2024-01-16T14:20:00Z",
  "motivo": "Venta a cliente",
  "descripcion": "Venta al por menor",
  "estado": "ACTIVO",
  
  // ✅ Campos de precio
  "precioUnitario": 35.00,
  "precioTotal": 175.00,
  "tipoPrecio": "VENTA",
  
  "producto": {
    "id": 5,
    "nombre": "Laptop HP Pavilion",
    "precioCompra": 25.50,
    "precioVenta": 35.00,
    "stock": 145,
    "unidad": "UNIDAD"
  }
}
```

### **3. Ajuste de Inventario (AJUSTE)**
```json
{
  "id": 3,
  "tipo": "ENTRADA",
  "cantidad": 2,
  "productoId": 5,
  "empresaId": 1,
  "fecha": "2024-01-17T09:15:00Z",
  "motivo": "Ajuste de inventario",
  "descripcion": "Productos encontrados en almacén",
  "estado": "ACTIVO",
  
  // ✅ Campos de precio
  "precioUnitario": 25.50,
  "precioTotal": 51.00,
  "tipoPrecio": "AJUSTE",
  
  "producto": {
    "id": 5,
    "nombre": "Laptop HP Pavilion",
    "precioCompra": 25.50,
    "precioVenta": 35.00,
    "stock": 147,
    "unidad": "UNIDAD"
  }
}
```

### **4. Transferencia entre Almacenes (TRANSFERENCIA)**
```json
{
  "id": 4,
  "tipo": "SALIDA",
  "cantidad": 10,
  "productoId": 5,
  "empresaId": 1,
  "fecha": "2024-01-18T11:45:00Z",
  "motivo": "Transferencia a sucursal",
  "descripcion": "Transferencia a almacén secundario",
  "estado": "ACTIVO",
  
  // ✅ Campos de precio
  "precioUnitario": 25.50,
  "precioTotal": 255.00,
  "tipoPrecio": "TRANSFERENCIA",
  
  "producto": {
    "id": 5,
    "nombre": "Laptop HP Pavilion",
    "precioCompra": 25.50,
    "precioVenta": 35.00,
    "stock": 137,
    "unidad": "UNIDAD"
  }
}
```

---

## 🏭 **Ejemplos por Industria**

### **Farmacia**
```json
{
  "id": 10,
  "tipo": "ENTRADA",
  "cantidad": 500,
  "productoId": 25,
  "empresaId": 1,
  "fecha": "2024-01-20T08:00:00Z",
  "motivo": "Compra de medicamentos",
  "descripcion": "Paracetamol 500mg - Lote #2024-001",
  "estado": "ACTIVO",
  
  "precioUnitario": 0.15,
  "precioTotal": 75.00,
  "tipoPrecio": "COMPRA",
  
  "producto": {
    "id": 25,
    "nombre": "Paracetamol 500mg",
    "precioCompra": 0.15,
    "precioVenta": 0.25,
    "stock": 2500,
    "unidad": "UNIDAD"
  },
  "proveedor": {
    "id": 8,
    "nombre": "Distribuidora Médica Central"
  }
}
```

### **Alimentos**
```json
{
  "id": 15,
  "tipo": "ENTRADA",
  "cantidad": 50,
  "productoId": 30,
  "empresaId": 1,
  "fecha": "2024-01-21T06:30:00Z",
  "motivo": "Compra de productos frescos",
  "descripcion": "Manzanas Gala - Frescas del día",
  "estado": "ACTIVO",
  
  "precioUnitario": 2.50,
  "precioTotal": 125.00,
  "tipoPrecio": "COMPRA",
  
  "producto": {
    "id": 30,
    "nombre": "Manzanas Gala",
    "precioCompra": 2.50,
    "precioVenta": 3.75,
    "stock": 200,
    "unidad": "KILOGRAMO"
  },
  "proveedor": {
    "id": 12,
    "nombre": "Frutas y Verduras Frescas"
  }
}
```

### **Electrónica**
```json
{
  "id": 20,
  "tipo": "SALIDA",
  "cantidad": 1,
  "productoId": 35,
  "empresaId": 1,
  "fecha": "2024-01-22T16:20:00Z",
  "motivo": "Venta de equipo",
  "descripcion": "Venta con garantía extendida",
  "estado": "ACTIVO",
  
  "precioUnitario": 899.99,
  "precioTotal": 899.99,
  "tipoPrecio": "VENTA",
  
  "producto": {
    "id": 35,
    "nombre": "iPhone 15 Pro 128GB",
    "precioCompra": 750.00,
    "precioVenta": 899.99,
    "stock": 15,
    "unidad": "UNIDAD"
  }
}
```

---

## 📊 **Cálculos Financieros**

### **Ejemplo de Cálculo de Margen**
```typescript
// Movimiento de entrada (compra)
const entrada = {
  cantidad: 100,
  precioUnitario: 25.50,
  precioTotal: 2550.00,
  tipoPrecio: "COMPRA"
}

// Movimiento de salida (venta)
const salida = {
  cantidad: 5,
  precioUnitario: 35.00,
  precioTotal: 175.00,
  tipoPrecio: "VENTA"
}

// Cálculo de margen por unidad
const margenUnitario = salida.precioUnitario - entrada.precioUnitario
// 35.00 - 25.50 = 9.50

// Cálculo de margen porcentual
const margenPorcentual = (margenUnitario / entrada.precioUnitario) * 100
// (9.50 / 25.50) * 100 = 37.25%

// Cálculo de utilidad total
const utilidadTotal = (salida.precioTotal - (entrada.precioUnitario * salida.cantidad))
// 175.00 - (25.50 * 5) = 175.00 - 127.50 = 47.50
```

---

## 🔄 **Flujo de Trabajo Recomendado**

### **1. Creación de Movimiento**
```typescript
// Ejemplo de creación de movimiento con precios
const nuevoMovimiento = {
  tipo: "ENTRADA",
  cantidad: 50,
  productoId: 5,
  motivo: "Compra mensual",
  descripcion: "Compra de stock regular",
  
  // ✅ Campos de precio (opcionales - se calculan automáticamente)
  precioUnitario: 25.50,        // Si no se proporciona, usa precioCompra del producto
  precioTotal: 1275.00,         // Si no se proporciona, se calcula automáticamente
  tipoPrecio: "COMPRA"          // Si no se proporciona, se determina por tipo de movimiento
}
```

### **2. Validaciones Automáticas**
```typescript
// ✅ Validaciones que se aplican automáticamente
if (precioUnitario && precioTotal) {
  const precioCalculado = precioUnitario * cantidad
  const diferencia = Math.abs(precioCalculado - precioTotal)
  
  if (diferencia > 0.01) {
    throw new Error('El precio total no coincide con el cálculo')
  }
}

// ✅ Determinación automática de tipoPrecio
if (!tipoPrecio) {
  tipoPrecio = tipo === 'ENTRADA' ? 'COMPRA' : 'VENTA'
}
```

### **3. Cálculo de Precios por Defecto**
```typescript
// ✅ Si no se proporciona precioUnitario
if (!precioUnitario) {
  if (tipo === 'ENTRADA') {
    precioUnitario = producto.precioCompra
  } else {
    precioUnitario = producto.precioVenta
  }
}

// ✅ Si no se proporciona precioTotal
if (!precioTotal && precioUnitario) {
  precioTotal = precioUnitario * cantidad
}
```

---

## 📈 **Reportes y Análisis**

### **1. Reporte de Movimientos por Período**
```typescript
const reporte = {
  periodo: {
    fechaInicio: "2024-01-01",
    fechaFin: "2024-01-31"
  },
  resumen: {
    totalMovimientos: 45,
    entradas: 20,
    salidas: 25
  },
  valores: {
    valorEntradas: 12500.00,
    valorSalidas: 18750.00,
    utilidadBruta: 6250.00,
    margenPromedio: 50.00
  },
  porTipoPrecio: {
    COMPRA: { total: 12500.00, cantidad: 500 },
    VENTA: { total: 18750.00, cantidad: 375 },
    AJUSTE: { total: 250.00, cantidad: 10 },
    TRANSFERENCIA: { total: 0.00, cantidad: 0 }
  }
}
```

### **2. Análisis por Producto**
```typescript
const analisisProducto = {
  productoId: 5,
  nombre: "Laptop HP Pavilion",
  movimientos: 12,
  stockActual: 137,
  valorInventario: 3493.50,  // stock * precioCompra
  costosTotales: 12750.00,   // Suma de movimientos COMPRA
  ingresosTotales: 17500.00, // Suma de movimientos VENTA
  utilidadBruta: 4750.00,
  margenPromedio: 37.25
}
```

---

## ⚠️ **Consideraciones Importantes**

### **1. Precisión de Cálculos**
- ✅ Usar `Math.round(valor * 100) / 100` para evitar errores de punto flotante
- ✅ Permitir diferencias de hasta 0.01 por redondeo
- ✅ Validar que precioTotal = precioUnitario × cantidad

### **2. Tipos de Precio**
- ✅ **COMPRA**: Para entradas con costo real
- ✅ **VENTA**: Para salidas con ingreso real
- ✅ **AJUSTE**: Para correcciones de inventario
- ✅ **TRANSFERENCIA**: Para movimientos entre almacenes

### **3. Validaciones de Negocio**
- ✅ Precios no pueden ser negativos
- ✅ Cantidad debe ser mayor a 0
- ✅ Fecha no puede ser futura
- ✅ Stock no puede ser negativo después de salida

### **4. Performance**
- ✅ Índices en base de datos para consultas eficientes
- ✅ Cache de estadísticas para reportes frecuentes
- ✅ Paginación para listas grandes de movimientos

---

## 🎯 **Beneficios de esta Estructura**

1. **Precisión financiera** - Tracking completo de costos e ingresos
2. **Análisis detallado** - Reportes por tipo de movimiento
3. **Trazabilidad** - Historial completo de precios
4. **Flexibilidad** - Soporte para diferentes tipos de transacción
5. **Escalabilidad** - Estructura preparada para crecimiento

Esta plantilla proporciona una base sólida para implementar un sistema completo de tracking de precios en movimientos de inventario. 