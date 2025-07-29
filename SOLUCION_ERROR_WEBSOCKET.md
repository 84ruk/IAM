# 🔧 Solución: Error "Cannot read properties of undefined (reading 'empresaId')"

## 📋 **Problema Identificado**

El error indica que `client.data.user` es `undefined` en el `handleConnection` del WebSocket, lo que significa que los guards de autenticación no se están ejecutando correctamente o no están asignando el usuario al socket.

### **Error Original:**
```
TypeError: Cannot read properties of undefined (reading 'empresaId')
    at ImportacionGateway.handleConnection (/Users/barukramos/Desktop/Proyecto IAM/iam-backend/src/websockets/importacion/importacion.gateway.ts:55:35)
```

---

## ✅ **Solución Implementada**

### **1. Validación Defensiva en handleConnection**

**Archivo:** `iam-backend/src/websockets/importacion/importacion.gateway.ts`

**Problema:** El código asumía que `client.data.user` siempre existía.

**Solución:** Agregar validación defensiva para manejar casos donde el usuario no está autenticado.

```typescript
handleConnection(client: Socket) {
  try {
    const user = client.data.user as JwtUser;
    
    // Validación defensiva: verificar que el usuario existe
    if (!user) {
      this.logger.warn(`❌ Cliente sin usuario autenticado - Socket ID: ${client.id}`);
      client.emit('connection:error', {
        message: 'Usuario no autenticado',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
      return;
    }

    // Validación defensiva: verificar que el usuario tiene empresaId
    if (!user.empresaId) {
      this.logger.warn(`❌ Usuario sin empresa asignada - Socket ID: ${client.id} - Usuario: ${user.email}`);
      client.emit('connection:error', {
        message: 'Usuario sin empresa asignada',
        error: 'EMPRESA_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
      return;
    }
    
    // Continuar con la lógica normal...
  } catch (error) {
    // Manejo de errores...
  }
}
```

### **2. Logs de Debugging Detallados**

**Archivos Modificados:**
- `iam-backend/src/websockets/common/websocket-auth.guard.ts`
- `iam-backend/src/websockets/common/websocket-empresa.guard.ts`
- `iam-backend/src/auth/services/websocket-auth.service.ts`

**Propósito:** Agregar logs detallados para diagnosticar dónde falla el proceso de autenticación.

```typescript
// WebSocketAuthGuard
this.logger.debug(`🔐 WebSocketAuthGuard: Iniciando autenticación - Socket ID: ${client.id}`);
this.logger.debug(`🔍 WebSocketAuthGuard: Handshake headers:`, {
  socketId: client.id,
  hasCookies: !!client.handshake.headers.cookie,
  hasAuthorization: !!client.handshake.headers.authorization,
  cookies: client.handshake.headers.cookie,
  origin: client.handshake.headers.origin
});

// WebSocketAuthService
this.logger.debug(`🔐 WebSocketAuthService: Autenticando WebSocket - Socket ID: ${client.id}`);
this.logger.debug(`✅ WebSocketAuthService: Token encontrado, verificando... - Socket ID: ${client.id}`);

// WebSocketEmpresaGuard
this.logger.debug(`🏢 WebSocketEmpresaGuard: Verificando empresa - Socket ID: ${client.id}`);
this.logger.debug(`🔍 WebSocketEmpresaGuard: Usuario encontrado - Email: ${user.email} - EmpresaId: ${user.empresaId} - Socket ID: ${client.id}`);
```

### **3. Script de Diagnóstico**

**Archivo:** `diagnostico-websocket-config.js`

**Propósito:** Verificar la configuración del sistema antes de intentar conectar.

```javascript
async function runDiagnostic() {
  const results = {
    backendHealth: await checkBackendHealth(),
    authEndpoint: await checkAuthEndpoint(),
    websocketEndpoint: await checkWebSocketEndpoint(),
    environmentVars: await checkEnvironmentVariables(),
    ports: await checkPorts()
  };
  
  // Mostrar resultados...
}
```

---

## 🔍 **Diagnóstico del Problema**

### **1. Verificar que los Guards se Ejecuten**

**Logs a buscar:**
```
✅ WebSocketAuthGuard inicializado
✅ WebSocketEmpresaGuard inicializado
✅ WebSocketAuthService inicializado
🔐 WebSocketAuthGuard: Iniciando autenticación - Socket ID: [ID]
🔐 WebSocketAuthService: Autenticando WebSocket - Socket ID: [ID]
🏢 WebSocketEmpresaGuard: Verificando empresa - Socket ID: [ID]
```

### **2. Verificar Extracción de Token**

**Logs a buscar:**
```
🔍 WebSocketAuthGuard: Handshake headers: {
  hasCookies: true,
  hasAuthorization: false,
  cookies: "jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
✅ WebSocketAuthService: Token encontrado, verificando... - Socket ID: [ID]
```

### **3. Verificar Validación de Usuario**

**Logs a buscar:**
```
✅ WebSocketAuthService: Token verificado, validando payload... - Socket ID: [ID]
✅ WebSocketAuthService: WebSocket autenticado exitosamente - Usuario: [email] - Empresa: [empresaId] - Socket ID: [ID]
🔍 WebSocketEmpresaGuard: Usuario encontrado - Email: [email] - EmpresaId: [empresaId] - Socket ID: [ID]
✅ WebSocketEmpresaGuard: Usuario autorizado - Usuario: [email] - Empresa: [empresaId] - Socket ID: [ID]
```

---

## 🚀 **Pasos para Resolver**

### **1. Reiniciar el Backend**
```bash
cd iam-backend
pkill -f "npm run start:dev"
npm run start:dev
```

### **2. Verificar Logs de Inicialización**
Buscar en los logs:
```
✅ WebSocketAuthGuard inicializado
✅ WebSocketEmpresaGuard inicializado
✅ WebSocketAuthService inicializado
ImportacionGateway inicializado
```

### **3. Intentar Conexión WebSocket**
Desde el frontend, intentar conectar y verificar los logs del backend.

### **4. Analizar Logs de Autenticación**
Si los logs muestran que la autenticación falla, verificar:
- Cookies JWT en el handshake
- Configuración de CORS
- Variables de entorno

### **5. Ejecutar Diagnóstico**
```bash
node diagnostico-websocket-config.js
```

---

## 🔧 **Posibles Causas del Error**

### **1. Guards No Se Ejecutan**
- **Causa:** Dependencias no inyectadas correctamente
- **Solución:** Verificar que `WebSocketAuthService` esté registrado en `AuthModule`

### **2. Token No Se Extrae**
- **Causa:** Cookies no se envían o no se parsean correctamente
- **Solución:** Verificar `withCredentials: true` en el frontend

### **3. Token Inválido**
- **Causa:** JWT expirado, malformado o en blacklist
- **Solución:** Verificar logs de validación de token

### **4. Usuario Sin Empresa**
- **Causa:** Usuario no tiene `empresaId` asignado
- **Solución:** Verificar configuración de empresa del usuario

---

## 📊 **Logs Esperados (Caso Exitoso)**

```
[Nest] - WebSocketAuthGuard inicializado
[Nest] - WebSocketEmpresaGuard inicializado
[Nest] - WebSocketAuthService inicializado
[Nest] - ImportacionGateway inicializado

[Nest] - 🔐 WebSocketAuthGuard: Iniciando autenticación - Socket ID: abc123
[Nest] - 🔍 WebSocketAuthGuard: Handshake headers: { hasCookies: true, cookies: "jwt=..." }
[Nest] - 🔐 WebSocketAuthService: Autenticando WebSocket - Socket ID: abc123
[Nest] - ✅ WebSocketAuthService: Token encontrado, verificando... - Socket ID: abc123
[Nest] - ✅ WebSocketAuthService: Token verificado, validando payload... - Socket ID: abc123
[Nest] - ✅ WebSocketAuthService: WebSocket autenticado exitosamente - Usuario: user@example.com - Empresa: 1 - Socket ID: abc123
[Nest] - ✅ WebSocketAuthGuard: Autenticación exitosa - Usuario: user@example.com - Socket ID: abc123
[Nest] - 🏢 WebSocketEmpresaGuard: Verificando empresa - Socket ID: abc123
[Nest] - 🔍 WebSocketEmpresaGuard: Usuario encontrado - Email: user@example.com - EmpresaId: 1 - Socket ID: abc123
[Nest] - ✅ WebSocketEmpresaGuard: Usuario autorizado - Usuario: user@example.com - Empresa: 1 - Socket ID: abc123
[Nest] - ✅ Cliente conectado: abc123 - Usuario: user@example.com - Empresa: 1 - Rol: ADMIN
```

---

## 🔒 **Seguridad Implementada**

### **1. Validación Defensiva**
- ✅ **Verificación de usuario** antes de acceder a propiedades
- ✅ **Verificación de empresa** antes de continuar
- ✅ **Manejo de errores** con mensajes claros
- ✅ **Desconexión automática** en caso de error

### **2. Logs de Auditoría**
- ✅ **Logs detallados** de cada paso del proceso
- ✅ **Identificación de Socket ID** para tracking
- ✅ **Información de usuario** para debugging
- ✅ **Timestamps** para auditoría

### **3. Manejo de Errores**
- ✅ **Mensajes de error** claros para el cliente
- ✅ **Desconexión automática** en caso de fallo
- ✅ **Logs de error** para debugging
- ✅ **Recuperación graceful** del sistema

---

## 🎯 **Resultado Esperado**

### **Antes (Error):**
```
TypeError: Cannot read properties of undefined (reading 'empresaId')
```

### **Después (Solución):**
```
✅ Cliente conectado: [ID] - Usuario: [email] - Empresa: [empresaId] - Rol: [rol]
```

---

## 📝 **Notas Importantes**

- **Validación defensiva:** Siempre verificar que `client.data.user` existe antes de acceder a sus propiedades
- **Logs detallados:** Usar logs para diagnosticar problemas de autenticación
- **Manejo de errores:** Proporcionar mensajes claros al cliente en caso de error
- **Desconexión graceful:** Desconectar automáticamente clientes no autenticados
- **Auditoría:** Mantener logs de todos los intentos de conexión para seguridad

---

**Esta solución proporciona una base robusta para manejar errores de autenticación en WebSockets y facilita el debugging de problemas futuros.** 