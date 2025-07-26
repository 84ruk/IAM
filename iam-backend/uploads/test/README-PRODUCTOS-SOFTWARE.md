# 📁 Archivos de Productos para Empresa de Software

## 🎯 Propósito
Archivos de prueba creados para simular productos de una empresa de software que vende tanto software como hardware.

## 📋 Archivos Disponibles

### 1. `productos-software-test.xlsx`
**Productos de Software (Licencias)**

| # | Producto | Precio Venta | Stock | Descripción |
|---|----------|--------------|-------|-------------|
| 1 | Licencia Microsoft Office 365 | $180 | 50 | Suite completa de Office 365 para empresas |
| 2 | Adobe Creative Suite Pro | $650 | 25 | Suite completa de Adobe para diseño gráfico |

**Características:**
- **Tipo:** ELECTRONICO
- **Unidad:** LICENCIA
- **Etiquetas:** Microsoft, Adobe, Software, Licencia
- **SKUs únicos:** MSO-365-ENT, ACS-PRO-2024

### 2. `productos-hardware-test.xlsx`
**Productos de Hardware**

| # | Producto | Precio Venta | Stock | Descripción |
|---|----------|--------------|-------|-------------|
| 1 | Laptop Dell Latitude 5520 | $1,800 | 15 | Laptop empresarial con Intel i7, 16GB RAM |
| 2 | Monitor LG 27" 4K Ultra HD | $520 | 20 | Monitor profesional 4K para diseño |
| 3 | Teclado Mecánico Logitech MX Keys | $130 | 30 | Teclado inalámbrico para programadores |

**Características:**
- **Tipo:** ELECTRONICO
- **Unidad:** UNIDAD
- **Etiquetas:** Dell, LG, Logitech, Hardware
- **SKUs únicos:** DELL-LAT-5520, LG-27-4K, LOG-MX-KEYS

## 🚀 Cómo Usar

### Para Importar en el Sistema:

1. **Ir al Dashboard** de la aplicación
2. **Hacer clic en "Importar Datos"**
3. **Seleccionar "Productos"** como tipo de importación
4. **Subir el archivo** deseado:
   - `productos-software-test.xlsx` para software
   - `productos-hardware-test.xlsx` para hardware
5. **Configurar opciones:**
   - ✅ **Sobrescribir existentes:** No (recomendado)
   - ✅ **Solo validar:** Sí (para probar primero)
   - ✅ **Notificar por email:** Opcional
6. **Hacer clic en "Importar"**

### Para Probar Validaciones:

1. **Editar el archivo** en Excel
2. **Introducir errores** como:
   - Nombres vacíos
   - Precios negativos
   - Tipos de producto inválidos
   - Unidades no permitidas
3. **Importar** y verificar que se muestren los errores

## 📊 Datos de Prueba

### Totales por Archivo:

**Software:**
- **Productos:** 2
- **Valor total:** $830 (50 × $180 + 25 × $650)
- **Stock total:** 75 unidades

**Hardware:**
- **Productos:** 3
- **Valor total:** $2,450 (15 × $1,800 + 20 × $520 + 30 × $130)
- **Stock total:** 65 unidades

**Combinado:**
- **Productos:** 5
- **Valor total:** $3,280
- **Stock total:** 140 unidades

## 🔧 Configuración Técnica

### Estructura de Columnas:
```excel
nombre | descripcion | stock | precioCompra | precioVenta | stockMinimo | tipoProducto | unidad | etiquetas | codigoBarras | sku
```

### Validaciones Aplicadas:
- ✅ **Nombres:** 2-100 caracteres, requeridos
- ✅ **Stock:** 0-999,999, números enteros
- ✅ **Precios:** > 0, hasta 2 decimales
- ✅ **Tipo Producto:** ELECTRONICO
- ✅ **Unidades:** LICENCIA (software) / UNIDAD (hardware)
- ✅ **Códigos de barras:** 12-13 dígitos
- ✅ **SKUs:** Únicos, mínimo 3 caracteres

## 🎨 Características de los Archivos

### Formato:
- **Tipo:** Excel (.xlsx)
- **Hojas:** 1 hoja "Productos"
- **Headers:** Con formato y colores
- **Datos:** Limpios y válidos

### Ubicación:
```
iam-backend/uploads/test/
├── productos-software-test.xlsx
└── productos-hardware-test.xlsx
```

## 🧪 Casos de Prueba

### 1. **Importación Exitosa:**
- Subir archivo sin errores
- Verificar que se creen los productos
- Confirmar que aparezcan en el dashboard

### 2. **Validación de Errores:**
- Modificar archivo con errores
- Verificar que se muestren errores específicos
- Confirmar que no se importen productos inválidos

### 3. **Sobrescritura:**
- Importar archivo existente
- Activar "Sobrescribir existentes"
- Verificar que se actualicen los productos

### 4. **Importación Parcial:**
- Crear archivo con algunos errores
- Verificar que se importen solo los válidos
- Confirmar reporte de errores

## 📝 Notas Importantes

- **Los archivos están listos** para importar inmediatamente
- **Todos los datos son ficticios** para pruebas
- **Los códigos de barras y SKUs** son únicos
- **Las etiquetas** están optimizadas para búsquedas
- **Los precios** son realistas para el mercado

## 🎯 Próximos Pasos

1. **Importar los archivos** en el sistema
2. **Verificar** que aparezcan en el dashboard
3. **Probar** las funcionalidades de búsqueda y filtrado
4. **Crear movimientos** para probar el inventario
5. **Generar reportes** para verificar los KPIs

---

**¡Los archivos están listos para probar la funcionalidad de importación! 🚀** 