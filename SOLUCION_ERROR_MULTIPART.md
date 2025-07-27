# Solución: Error "Multipart: Boundary not found"

## 🚨 **Problema Identificado**

### **Error en el Backend:**
```
ERROR [GlobalExceptionFilter] POST /importacion/productos - 400: Multipart: Boundary not found
```

### **¿Qué significa este error?**
- **Multipart**: Tipo de contenido usado para enviar archivos junto con otros datos
- **Boundary**: Separador que delimita las diferentes partes de un formulario multipart
- **Error 400**: El servidor no puede procesar la request porque falta el boundary

## 🔍 **Causa del Problema**

### **❌ Código Problemático:**
```typescript
// En el frontend
const formData = new FormData()
formData.append('archivo', archivo)
formData.append('opciones', JSON.stringify(opciones))

const response = await apiClient.post('/importacion/productos', formData, {
  headers: {
    'Content-Type': 'multipart/form-data', // ❌ PROBLEMA AQUÍ
  },
})
```

### **¿Por qué es problemático?**
1. **FormData automático**: Cuando usas `FormData`, el navegador establece automáticamente el `Content-Type` con el boundary correcto
2. **Boundary faltante**: Al establecer manualmente `'Content-Type': 'multipart/form-data'`, se omite el boundary
3. **Error del servidor**: El servidor no puede parsear la request sin el boundary

## ✅ **Solución Implementada**

### **1. Eliminar Content-Type Manual**
```typescript
// ✅ Código Corregido
const formData = new FormData()
formData.append('archivo', archivo)
formData.append('opciones', JSON.stringify(opciones))

const response = await apiClient.post('/importacion/productos', formData)
// Sin headers manuales - el navegador lo hace automáticamente
```

### **2. Mejorar el Cliente API**
```typescript
async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  // Si es FormData, no establecer Content-Type manualmente
  if (data instanceof FormData) {
    const { headers, ...restConfig } = config || {}
    const { 'Content-Type': _, ...restHeaders } = headers || {}
    
    return this.makeRequest({ 
      ...restConfig, 
      method: 'POST', 
      url, 
      data,
      headers: restHeaders // Sin Content-Type
    })
  }
  
  return this.makeRequest({ ...config, method: 'POST', url, data })
}
```

## 🔧 **Archivos Modificados**

### **1. `iam-frontend/src/lib/api/importacion.ts`**
- Eliminado `Content-Type: 'multipart/form-data'` de todos los métodos
- `importarProductos()`
- `importarProveedores()`
- `importarMovimientos()`
- `importarUnificada()`
- `importarAuto()`
- `validarAuto()`

### **2. `iam-frontend/src/lib/api/apiClient.ts`**
- Agregada lógica para detectar FormData
- Eliminación automática de Content-Type manual
- Manejo seguro de headers

## 📊 **Cómo Funciona FormData**

### **Antes (Problemático):**
```http
POST /importacion/productos HTTP/1.1
Content-Type: multipart/form-data

--boundary123
Content-Disposition: form-data; name="archivo"; filename="productos.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[contenido del archivo]
--boundary123
Content-Disposition: form-data; name="opciones"

{"sobrescribirExistentes":true,"validarSolo":false}
--boundary123--
```

### **Después (Correcto):**
```http
POST /importacion/productos HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryABC123

------WebKitFormBoundaryABC123
Content-Disposition: form-data; name="archivo"; filename="productos.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[contenido del archivo]
------WebKitFormBoundaryABC123
Content-Disposition: form-data; name="opciones"

{"sobrescribirExistentes":true,"validarSolo":false}
------WebKitFormBoundaryABC123--
```

## 🧪 **Verificación de la Solución**

### **1. Verificar en DevTools:**
```javascript
// En la consola del navegador
// Verificar que el Content-Type se establece automáticamente
fetch('/api/importacion/productos', {
  method: 'POST',
  body: formData
}).then(response => {
  console.log('Request headers:', response.headers)
})
```

### **2. Verificar en Network Tab:**
- Abrir DevTools > Network
- Hacer una importación
- Verificar que el Content-Type incluye el boundary
- Verificar que no hay errores 400

### **3. Verificar en el Backend:**
```bash
# Los logs del backend no deberían mostrar:
# ERROR [GlobalExceptionFilter] POST /importacion/productos - 400: Multipart: Boundary not found
```

## 🎯 **Beneficios de la Solución**

### **✅ Ventajas:**
- **Eliminación del error 400**
- **Carga de archivos funcional**
- **Código más limpio y estándar**
- **Compatibilidad con todos los navegadores**

### **🛡️ Prevención:**
- **Detección automática de FormData**
- **Eliminación automática de Content-Type manual**
- **Manejo seguro de headers**

## 📚 **Mejores Prácticas**

### **✅ Para FormData:**
```typescript
// ✅ Correcto
const formData = new FormData()
formData.append('archivo', archivo)
formData.append('opciones', JSON.stringify(opciones))

await apiClient.post('/endpoint', formData)
// Sin headers manuales
```

### **❌ Evitar:**
```typescript
// ❌ Incorrecto
const formData = new FormData()
formData.append('archivo', archivo)

await apiClient.post('/endpoint', formData, {
  headers: {
    'Content-Type': 'multipart/form-data' // ❌ No establecer manualmente
  }
})
```

### **✅ Para JSON:**
```typescript
// ✅ Correcto para JSON
await apiClient.post('/endpoint', data, {
  headers: {
    'Content-Type': 'application/json' // ✅ OK para JSON
  }
})
```

## 🎉 **Resultado Final**

Con esta solución:
- ✅ **Error 400 eliminado**
- ✅ **Carga de archivos funcional**
- ✅ **Código más robusto**
- ✅ **Mejor experiencia de usuario**

El error "Multipart: Boundary not found" debería estar **completamente resuelto**. 