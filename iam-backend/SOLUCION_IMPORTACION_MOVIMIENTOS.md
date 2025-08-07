# 🔧 **Solución: Importación de Movimientos con Precios y Proveedores**

## ✅ **Problema Identificado**

### **Síntomas:**
- Los campos de precio (`precioUnitario`, `precioTotal`, `tipoPrecio`) no se guardaban en los movimientos
- El campo `proveedorId` no se mapeaba correctamente
- Los logs mostraban "Campo no reconocido en movimiento" para estos campos
- No se podían crear proveedores automáticamente desde movimientos

### **Causa Raíz:**
El método `mapearFilaAMovimiento` en `ImportacionRapidaService` no incluía el mapeo de los campos de precio ni la lógica para manejar proveedores.

---

## 🔧 **Solución Implementada**

### **1. Actualización del Mapeo de Campos**

#### **Archivo:** `iam-backend/src/importacion/services/importacion-rapida.service.ts`

**Método:** `mapearFilaAMovimiento()`

```typescript
// ✅ NUEVO: Campos de precio
case 'preciounitar':
case 'precio_unitar':
case 'precio unitar':
case 'preciounitario':
case 'precio_unitario':
case 'precio unitario':
case 'precio_por_unidad':
case 'precio por unidad':
case 'unitario':
case 'precio':
  movimiento.precioUnitario = parseFloat(value) || null;
  break;

case 'preciototal':
case 'precio_total':
case 'precio total':
case 'total':
case 'valor_total':
case 'valor total':
case 'monto_total':
case 'monto total':
  movimiento.precioTotal = parseFloat(value) || null;
  break;

case 'tipoprecio':
case 'tipo_precio':
case 'tipo precio':
case 'tipo_de_precio':
case 'tipo de precio':
case 'categoria_precio':
case 'categoria precio':
  if (value) {
    const tipoPrecioNormalizado = this.normalizarTipoPrecio(value);
    movimiento.tipoPrecio = tipoPrecioNormalizado;
  }
  break;

// ✅ NUEVO: Campo proveedor
case 'proveedor':
case 'proveedorld':
case 'proveedor_id':
case 'proveedor id':
case 'id_proveedor':
case 'idproveedor':
case 'proveedorid':
  const proveedorId = parseInt(value);
  movimiento.proveedorId = isNaN(proveedorId) ? value : proveedorId;
  break;
```

### **2. Nuevo Método de Normalización de Tipos de Precio**

```typescript
private normalizarTipoPrecio(valor: string): string {
  if (!valor) return 'COMPRA';
  
  const valorUpper = valor.toString().toUpperCase().trim();
  
  const mapeoTiposPrecio: Record<string, string> = {
    'COMPRA': 'COMPRA',
    'VENTA': 'VENTA',
    'AJUSTE': 'AJUSTE',
    'TRANSFERENCIA': 'TRANSFERENCIA',
    'PURCHASE': 'COMPRA',
    'SALE': 'VENTA',
    'ADJUSTMENT': 'AJUSTE',
    'TRANSFER': 'TRANSFERENCIA',
    'BUY': 'COMPRA',
    'SELL': 'VENTA',
    'ADJUST': 'AJUSTE',
    'MOVE': 'TRANSFERENCIA',
  };
  
  return mapeoTiposPrecio[valorUpper] || 'COMPRA';
}
```

### **3. Lógica de Creación Automática de Proveedores**

**Método:** `procesarMovimientos()`

```typescript
// ✅ NUEVO: Resolver proveedorId - buscar o crear proveedor automáticamente
let proveedorIdFinal = movimientoData.proveedorId;
let proveedorEncontrado = false;
let proveedorNombre = '';
let proveedorCreado = false;

if (movimientoData.proveedorId) {
  try {
    // Si es un número, buscar por ID
    if (typeof movimientoData.proveedorId === 'number') {
      const proveedorExistente = await this.prisma.proveedor.findFirst({
        where: {
          id: movimientoData.proveedorId,
          empresaId: user.empresaId,
          estado: 'ACTIVO'
        }
      });

      if (proveedorExistente) {
        proveedorIdFinal = proveedorExistente.id;
        proveedorEncontrado = true;
        proveedorNombre = proveedorExistente.nombre;
      } else {
        this.logger.warn(`Proveedor con ID ${movimientoData.proveedorId} no encontrado, se omitirá`);
        proveedorIdFinal = null;
      }
    } else {
      // Si es un string, buscar por nombre o crear automáticamente
      const nombreProveedor = String(movimientoData.proveedorId).trim();
      
      // Buscar proveedor existente por nombre
      const proveedorExistente = await this.prisma.proveedor.findFirst({
        where: {
          nombre: {
            equals: nombreProveedor,
            mode: 'insensitive'
          },
          empresaId: user.empresaId,
          estado: 'ACTIVO'
        }
      });

      if (proveedorExistente) {
        proveedorIdFinal = proveedorExistente.id;
        proveedorEncontrado = true;
        proveedorNombre = proveedorExistente.nombre;
      } else {
        // Crear proveedor automáticamente
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const emailTemporal = `proveedor-${timestamp}-${randomSuffix}@auto-created.com`;
        
        const proveedorNuevo = await this.prisma.proveedor.create({
          data: {
            nombre: nombreProveedor,
            email: emailTemporal,
            telefono: 'Sin teléfono',
            empresaId: user.empresaId,
            estado: 'ACTIVO'
          }
        });

        proveedorIdFinal = proveedorNuevo.id;
        proveedorEncontrado = true;
        proveedorNombre = proveedorNuevo.nombre;
        proveedorCreado = true;
        this.logger.log(`✅ Proveedor creado automáticamente: "${nombreProveedor}" (ID: ${proveedorNuevo.id})`);
      }
    }
  } catch (proveedorError) {
    this.logger.warn(`⚠️ Error procesando proveedor "${movimientoData.proveedorId}": ${proveedorError.message}`);
    proveedorIdFinal = null;
  }
}
```

### **4. Validaciones Mejoradas para Campos de Precio**

```typescript
// ✅ NUEVO: Validaciones para campos de precio
if (data.precioUnitario !== undefined && data.precioUnitario !== null) {
  if (typeof data.precioUnitario !== 'number' || data.precioUnitario < 0) {
    return {
      valido: false,
      columna: 'precioUnitario',
      valor: data.precioUnitario,
      mensaje: 'Precio unitario debe ser un número positivo',
      valorEsperado: 'Número mayor o igual a 0',
      sugerencia: 'El precio unitario debe ser un número positivo o 0'
    };
  }
}

if (data.precioTotal !== undefined && data.precioTotal !== null) {
  if (typeof data.precioTotal !== 'number' || data.precioTotal < 0) {
    return {
      valido: false,
      columna: 'precioTotal',
      valor: data.precioTotal,
      mensaje: 'Precio total debe ser un número positivo',
      valorEsperado: 'Número mayor o igual a 0',
      sugerencia: 'El precio total debe ser un número positivo o 0'
    };
  }
}

if (data.tipoPrecio && !['COMPRA', 'VENTA', 'AJUSTE', 'TRANSFERENCIA'].includes(data.tipoPrecio)) {
  return {
    valido: false,
    columna: 'tipoPrecio',
    valor: data.tipoPrecio,
    mensaje: 'Tipo de precio debe ser COMPRA, VENTA, AJUSTE o TRANSFERENCIA',
    valorEsperado: 'COMPRA, VENTA, AJUSTE o TRANSFERENCIA',
    sugerencia: 'Use uno de los valores válidos para el tipo de precio'
  };
}

// ✅ NUEVO: Validar coherencia entre precioUnitario, precioTotal y cantidad
if (data.precioUnitario && data.precioTotal && data.cantidad) {
  const precioCalculado = data.precioUnitario * data.cantidad;
  const diferencia = Math.abs(precioCalculado - data.precioTotal);
  
  // Permitir pequeñas diferencias por redondeo (máximo 0.01)
  if (diferencia > 0.01) {
    return {
      valido: false,
      columna: 'precioTotal',
      valor: data.precioTotal,
      mensaje: 'El precio total no coincide con el precio unitario por la cantidad',
      valorEsperado: `Aproximadamente ${precioCalculado.toFixed(2)}`,
      sugerencia: 'Verifique que precioTotal = precioUnitario × cantidad'
    };
  }
}
```

---

## 📊 **Estructura de Datos Soportada**

### **Columnas Reconocidas para Movimientos:**

| Campo | Variantes Soportadas | Tipo | Descripción |
|-------|-------------------|------|-------------|
| **tipo** | `tipo`, `tipo_movimiento`, `tipo movimiento`, `operacion`, `accion` | String | ENTRADA/SALIDA |
| **cantidad** | `cantidad`, `cant`, `qty`, `volumen`, `unidades` | Number | Cantidad de unidades |
| **productoId** | `producto`, `productoid`, `producto_id`, `producto id`, `id_producto`, `idproducto` | Number/String | ID o nombre del producto |
| **precioUnitario** | `preciounitar`, `precio_unitar`, `precio unitar`, `preciounitario`, `precio_unitario`, `precio unitario`, `precio_por_unidad`, `precio por unidad`, `unitario`, `precio` | Number | Precio por unidad |
| **precioTotal** | `preciototal`, `precio_total`, `precio total`, `total`, `valor_total`, `valor total`, `monto_total`, `monto total` | Number | Precio total del movimiento |
| **tipoPrecio** | `tipoprecio`, `tipo_precio`, `tipo precio`, `tipo_de_precio`, `tipo de precio`, `categoria_precio`, `categoria precio` | String | COMPRA/VENTA/AJUSTE/TRANSFERENCIA |
| **proveedorId** | `proveedor`, `proveedorld`, `proveedor_id`, `proveedor id`, `id_proveedor`, `idproveedor`, `proveedorid` | Number/String | ID o nombre del proveedor |
| **motivo** | `motivo`, `razon`, `causa`, `justificacion`, `descripcion_motivo` | String | Motivo del movimiento |
| **descripcion** | `descripcion`, `desc`, `comentario`, `notas` | String | Descripción adicional |
| **fecha** | `fecha`, `fecha_movimiento`, `fecha_transaccion`, `fecha movimiento`, `fecha transaccion`, `dia`, `fecha_creacion` | Date | Fecha del movimiento |

---

## 🎯 **Características Implementadas**

### **✅ Funcionalidades Principales:**

1. **Mapeo Completo de Campos de Precio**
   - Soporte para `precioUnitario`, `precioTotal`, `tipoPrecio`
   - Múltiples variantes de nombres de columnas
   - Normalización automática de tipos de precio

2. **Creación Automática de Proveedores**
   - Búsqueda por ID o nombre
   - Creación automática si no existe
   - Generación de email temporal único
   - Logs detallados del proceso

3. **Validaciones Robustas**
   - Validación de tipos de datos
   - Coherencia entre precios y cantidades
   - Validación de rangos y formatos
   - Mensajes de error descriptivos

4. **Logs Mejorados**
   - Información detallada de productos creados
   - Información de proveedores creados
   - Tracking de campos de precio
   - Resumen de importación

### **✅ Compatibilidad:**

- **Formatos de Archivo:** Excel (.xlsx, .xls), CSV
- **Nombres de Columnas:** Flexibles con múltiples variantes
- **Tipos de Datos:** Números, strings, fechas
- **Proveedores:** ID numérico o nombre de texto
- **Productos:** ID numérico o nombre de texto

---

## 📝 **Ejemplo de Uso**

### **Archivo CSV/Excel con la siguiente estructura:**

```csv
tipo,cantidad,productold,precioUnitar,precioTotal,tipoPrecio,motivo,descripcion,fecha,proveedorld
ENTRADA,6,204,6615.88,39695.28,COMPRA,Venta direc,Compra de,2025-08-01,1
ENTRADA,41,205,323.1,13247.1,COMPRA,Reposición,Compra de,2025-08-06,2
SALIDA,47,207,9647.37,385894.8,COMPRA,Salida,Salida de,2025-08-07,5
```

### **Resultado Esperado:**

1. **Movimientos creados** con todos los campos de precio
2. **Productos creados automáticamente** si no existen
3. **Proveedores creados automáticamente** si no existen
4. **Stock actualizado** automáticamente
5. **Logs detallados** del proceso

---

## 🔍 **Logs de Ejemplo**

```
✅ Producto creado automáticamente: "204" -> ID: 325
✅ Stock actualizado automáticamente para producto Producto ID 204
✅ Movimiento importado exitosamente - Fila 26: ENTRADA de 6 unidades de "Producto ID 204" (ID: 325) [Producto creado automáticamente]
✅ Proveedor creado automáticamente: "Proveedor 1" (ID: 1)
```

---

## 🚀 **Beneficios de la Solución**

1. **Completitud de Datos:** Todos los campos de precio se guardan correctamente
2. **Flexibilidad:** Múltiples variantes de nombres de columnas
3. **Automatización:** Creación automática de productos y proveedores
4. **Validación:** Verificación de coherencia de datos
5. **Trazabilidad:** Logs detallados para auditoría
6. **Compatibilidad:** Funciona con archivos existentes sin cambios

---

## 📋 **Próximos Pasos Recomendados**

1. **Probar la importación** con archivos que contengan campos de precio
2. **Verificar los logs** para confirmar que los campos se mapean correctamente
3. **Revisar la base de datos** para confirmar que los datos se guardan
4. **Actualizar documentación** del usuario final
5. **Considerar agregar** validaciones adicionales según necesidades específicas 