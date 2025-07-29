# 🔧 Solución: Intermitencia en WebSocket

## 📋 **Problema Identificado**

El WebSocket funciona correctamente pero presenta **intermitencia** en las conexiones:
- ✅ **A veces conecta exitosamente**
- ❌ **A veces se desconecta inmediatamente** (`io server disconnect`)
- 🔄 **Bucle de reconexión** que puede ser infinito

### **Causa Raíz**
- **Cookies HttpOnly:** No son accesibles desde JavaScript (`document.cookie`)
- **Verificación incorrecta:** El frontend intenta verificar cookies HttpOnly
- **Reconexión agresiva:** Sin límites adecuados de intentos
- **Timing issues:** Reconexión demasiado rápida

---

## ✅ **Solución Implementada**

### **1. Corrección del Frontend**

**Archivo:** `iam-frontend/src/hooks/useLazyWebSocket.ts`

**Problema:** El frontend intentaba verificar cookies HttpOnly que no son accesibles.

**Solución:** 
- ✅ **Eliminar dependencia de `document.cookie`** para cookies HttpOnly
- ✅ **Confiar en `withCredentials: true`** para envío automático
- ✅ **Mejorar logs** para explicar el comportamiento

```typescript
// Log detallado para diagnosticar el problema
console.log('🔍 WebSocket: Configuración de conexión:', {
  url: `${baseUrl}/importacion`,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  cookies: document.cookie,
  hasJwtCookie: document.cookie.includes('jwt='), // Solo para debugging
  cookieDetails: document.cookie.split(';').map(c => c.trim()),
  note: 'Las cookies HttpOnly no son accesibles desde JavaScript, pero se envían automáticamente con withCredentials: true'
});
```

### **2. Mejora del Manejo de Reconexión**

**Archivo:** `iam-frontend/src/hooks/useLazyWebSocket.ts`

**Problema:** Reconexión agresiva sin límites adecuados.

**Solución:**
- ✅ **Verificación de autenticación** antes de reconectar
- ✅ **Delay aumentado** (2 segundos en lugar de 1)
- ✅ **Límite de intentos** respetado
- ✅ **Logs mejorados** para debugging

```typescript
newSocket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket: Desconectado:', reason)
  setIsConnected(false)
  if (reason === 'io server disconnect') {
    // El servidor desconectó, verificar si es por autenticación
    console.log('🔄 WebSocket: Servidor desconectó, verificando autenticación...')
    
    // Esperar un poco más antes de reconectar para evitar spam
    setTimeout(() => {
      if (!signal.aborted && connectionAttempts.current < maxConnectionAttempts) {
        console.log('🔄 WebSocket: Intentando reconectar después de desconexión del servidor...')
        connect(signal)
      } else {
        console.log('🛑 WebSocket: No se reconectará - máximo de intentos alcanzado o conexión cancelada')
      }
    }, 2000) // Esperar 2 segundos antes de reconectar
  }
})
```

### **3. Verificación de Autenticación Antes de Conectar**

**Archivo:** `iam-frontend/src/hooks/useLazyWebSocket.ts`

**Problema:** Intentos de conexión sin verificar autenticación.

**Solución:**
- ✅ **Verificación previa** de usuario y empresaId
- ✅ **Evitar intentos innecesarios** cuando no hay autenticación
- ✅ **Logs claros** para identificar el problema

```typescript
// Verificar autenticación antes de intentar conectar
if (!user || !user.empresaId) {
  console.log('❌ WebSocket: Usuario no autenticado, no intentando conectar')
  setConnectionError('Usuario no autenticado')
  return false
}
```

### **4. Logs Detallados en el Backend**

**Archivo:** `iam-backend/src/websockets/common/websocket-auth.guard.ts`

**Problema:** Difícil diagnosticar por qué falla la autenticación.

**Solución:**
- ✅ **Logs detallados** de cookies recibidas
- ✅ **Parsing de cookies** con información completa
- ✅ **Verificación de JWT** con detalles
- ✅ **Identificación clara** de dónde falla

```typescript
// Log adicional para verificar cookies específicamente
if (client.handshake.headers.cookie) {
  this.logger.debug(`🍪 Cookies raw recibidas: "${client.handshake.headers.cookie}"`);
  const parsedCookies = this.parseCookies(client.handshake.headers.cookie);
  this.logger.debug(`🍪 Cookies parseadas:`, parsedCookies);
  this.logger.debug(`🍪 JWT cookie presente: ${!!parsedCookies.jwt}`);
  if (parsedCookies.jwt) {
    this.logger.debug(`🍪 JWT cookie length: ${parsedCookies.jwt.length}`);
    this.logger.debug(`🍪 JWT cookie starts with: ${parsedCookies.jwt.substring(0, 20)}...`);
  }
} else {
  this.logger.warn(`❌ No se recibieron cookies en el handshake`);
}
```

---

## 🔧 **Cambios Técnicos Detallados**

### **Frontend - Manejo de Cookies**
- ✅ **Sin dependencia de `document.cookie`** para cookies HttpOnly
- ✅ **Confianza en `withCredentials: true`** para envío automático
- ✅ **Logs explicativos** del comportamiento esperado

### **Frontend - Reconexión Inteligente**
- ✅ **Verificación previa** de autenticación
- ✅ **Delay aumentado** para evitar spam
- ✅ **Límites de intentos** respetados
- ✅ **Logs detallados** del proceso

### **Backend - Diagnóstico Mejorado**
- ✅ **Logs detallados** de cookies recibidas
- ✅ **Parsing de cookies** con información completa
- ✅ **Verificación de JWT** con detalles
- ✅ **Identificación clara** de fallos

---

## 🎯 **Resultado Esperado**

### **Antes (Problema):**
```
Frontend: hasJwtCookie: false (intermitente)
Backend: ⚠️ Cliente intentó conectar sin usuario autenticado
Ciclo: Conectar → Desconectar → Reconectar (infinito)
```

### **Después (Solución):**
```
Frontend: withCredentials: true (siempre)
Backend: ✅ WebSocket autenticado exitosamente
Ciclo: Conectar → Mantener conexión estable
```

---

## 📁 **Archivos Modificados**

### **Frontend:**
- ✅ `iam-frontend/src/hooks/useLazyWebSocket.ts` - Manejo de reconexión mejorado

### **Backend:**
- ✅ `iam-backend/src/websockets/common/websocket-auth.guard.ts` - Logs detallados

---

## 🧪 **Testing**

### **1. Verificar Conexión Estable**
```typescript
// En los logs del frontend, verificar:
// ✅ WebSocket: Conectado exitosamente
// ✅ Sin bucles de reconexión infinitos
```

### **2. Verificar Autenticación Consistente**
```typescript
// En los logs del backend, verificar:
// ✅ 🍪 Cookies raw recibidas: "jwt=..."
// ✅ 🍪 JWT cookie presente: true
// ✅ WebSocket autenticado exitosamente
```

### **3. Verificar Manejo de Errores**
```typescript
// En caso de desconexión, verificar:
// 🔄 WebSocket: Servidor desconectó, verificando autenticación...
// 🔄 WebSocket: Intentando reconectar después de desconexión del servidor...
// 🛑 WebSocket: No se reconectará - máximo de intentos alcanzado
```

---

## 🔒 **Seguridad y Buenas Prácticas**

### **Seguridad:**
- ✅ **Cookies HttpOnly:** No accesibles desde JavaScript malicioso
- ✅ **Verificación de autenticación:** Antes de cada intento de conexión
- ✅ **Límites de reconexión:** Evita ataques de spam
- ✅ **Logs de auditoría:** Registra todos los intentos de conexión

### **Buenas Prácticas:**
- ✅ **Manejo robusto de errores:** Sin bucles infinitos
- ✅ **Logs detallados:** Para debugging y monitoreo
- ✅ **Verificación previa:** Evita intentos innecesarios
- ✅ **Timing adecuado:** Delays apropiados para reconexión

---

## 🚀 **Próximos Pasos**

1. **Reiniciar el backend** para aplicar los logs detallados
2. **Recargar el frontend** para usar la nueva lógica de reconexión
3. **Monitorear logs** para verificar conexión estable
4. **Verificar ausencia** de bucles infinitos de reconexión
5. **Limpiar logs de diagnóstico** una vez confirmado el funcionamiento

---

## 📝 **Notas Importantes**

- **Cookies HttpOnly:** No son accesibles desde JavaScript, pero se envían automáticamente
- **withCredentials: true:** Es la configuración correcta para enviar cookies automáticamente
- **Reconexión inteligente:** Verifica autenticación antes de intentar reconectar
- **Logs detallados:** Ayudan a identificar problemas específicos
- **Límites de intentos:** Evitan bucles infinitos y spam al servidor
- **Timing adecuado:** Delays apropiados para evitar sobrecarga 