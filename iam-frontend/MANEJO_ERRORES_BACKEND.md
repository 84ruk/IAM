# Manejo de Errores de Backend

Este documento describe el sistema mejorado para manejar errores cuando el backend no está disponible o presenta problemas de conexión.

## 🚨 Problema Original

Cuando el backend no está disponible, aparecían errores como:
```
ECONNREFUSED: connect ECONNREFUSED 127.0.0.1:3001
```

Esto causaba:
- Errores en la consola del navegador
- Experiencia de usuario pobre
- Falta de información sobre cómo resolver el problema

## ✅ Solución Implementada

### 1. **Componente BackendStatus**
Verifica automáticamente si el backend está disponible y muestra una interfaz amigable cuando no lo está.

```tsx
import { BackendStatus } from '@/components/ui/BackendStatus'

// En el layout principal
<BackendStatus>
  {children}
</BackendStatus>
```

### 2. **Hook useBackendError**
Maneja errores de backend de manera consistente en cualquier componente.

```tsx
import { useBackendError } from '@/hooks/useBackendError'

function MyComponent() {
  const { error, isRetrying, handleError, clearError, retryOperation } = useBackendError()
  
  const handleApiCall = async () => {
    try {
      const result = await apiCall()
      // Manejar éxito
    } catch (error) {
      handleError(error) // Maneja automáticamente el tipo de error
    }
  }
}
```

### 3. **Componente BackendErrorHandler**
Muestra errores de backend de manera elegante con opciones de reintento.

```tsx
import { BackendErrorHandler } from '@/components/ui/BackendErrorHandler'

<BackendErrorHandler
  error={error}
  isRetrying={isRetrying}
  onRetry={handleRetry}
  onClear={clearError}
>
  {/* Contenido normal del componente */}
</BackendErrorHandler>
```

## 🔧 Tipos de Errores Manejados

### **Errores de Conexión**
- `ECONNREFUSED`: Backend no disponible
- `ENOTFOUND`: No se puede resolver el host
- `NetworkError`: Error de red general
- `TimeoutError`: Tiempo de espera agotado

### **Errores de Autenticación**
- `401 Unauthorized`: Sesión expirada
- `403 Forbidden`: Sin permisos

### **Errores del Servidor**
- `5xx`: Errores internos del servidor

## 📋 Uso en Componentes

### Ejemplo Básico
```tsx
'use client'

import { useBackendError } from '@/hooks/useBackendError'
import { BackendErrorHandler } from '@/components/ui/BackendErrorHandler'

export default function MyComponent() {
  const { error, isRetrying, handleError, clearError, retryOperation } = useBackendError()
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Error fetching data')
      // Procesar datos
    } catch (error) {
      handleError(error)
    }
  }
  
  return (
    <BackendErrorHandler
      error={error}
      isRetrying={isRetrying}
      onRetry={retryOperation}
      onClear={clearError}
    >
      <div>
        {/* Contenido normal */}
        <button onClick={fetchData}>Cargar datos</button>
      </div>
    </BackendErrorHandler>
  )
}
```

### Ejemplo con Reintento Personalizado
```tsx
const handleRetry = () => {
  retryOperation(async () => {
    // Lógica de reintento personalizada
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('Error')
    return response.json()
  })
}
```

## 🎨 Personalización

### Colores por Tipo de Error
- **BackendUnavailable**: Rojo (crítico)
- **NetworkError**: Rojo (crítico)
- **Unauthorized**: Amarillo (advertencia)
- **ServerError**: Naranja (servidor)
- **UnknownError**: Rojo (genérico)

### Iconos por Tipo de Error
- **Conexión**: `WifiOff`
- **Autenticación**: `Shield`
- **Servidor**: `Server`
- **Genérico**: `AlertTriangle`

## 🔄 Flujo de Manejo de Errores

1. **Detección**: El error se detecta en el fetch/API call
2. **Clasificación**: Se clasifica automáticamente por tipo
3. **Manejo**: Se aplica el manejo específico según el tipo
4. **UI**: Se muestra la interfaz apropiada al usuario
5. **Recuperación**: Se ofrecen opciones de reintento/recuperación

## 🛠️ Configuración

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Timeouts
- **Health Check**: 3 segundos
- **API Calls**: 10 segundos
- **Auth Check**: 5 segundos

## 📱 Experiencia de Usuario

### Cuando el Backend No Está Disponible
1. **Pantalla de carga** mientras verifica conexión
2. **Mensaje claro** explicando el problema
3. **Botón de reintento** para verificar nuevamente
4. **Instrucciones** sobre cómo resolver el problema
5. **Opción de recargar** la página

### Durante Errores de Red
1. **Mensaje específico** sobre el tipo de error
2. **Sugerencias** para resolver el problema
3. **Reintento automático** opcional
4. **Fallback** para continuar sin funcionalidad

## 🚀 Beneficios

1. **Experiencia de Usuario Mejorada**
   - Mensajes claros y útiles
   - Opciones de recuperación
   - No más errores técnicos visibles

2. **Desarrollo Más Fácil**
   - Manejo consistente de errores
   - Reutilización de componentes
   - Menos código repetitivo

3. **Mantenimiento Simplificado**
   - Centralización del manejo de errores
   - Fácil personalización
   - Logs más limpios

4. **Robustez**
   - Manejo de diferentes tipos de errores
   - Recuperación automática
   - Fallbacks apropiados

## 🔍 Debugging

### Logs Mejorados
Los errores ahora se loggean de manera más limpia:
```javascript
// Antes
console.error('Error in requireAuth:', error)

// Ahora
console.warn('Backend no disponible - conexión rechazada')
```

### Información de Debug
- Tipo de error específico
- Código de error
- Mensaje descriptivo
- Sugerencias de solución

## 📝 Próximos Pasos

1. **Implementar en más componentes** que hagan llamadas al API
2. **Agregar métricas** de errores de backend
3. **Implementar notificaciones** push para errores críticos
4. **Agregar modo offline** para funcionalidades básicas 