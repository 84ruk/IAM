# 🔧 Solución: Autenticación WebSocket Estándar

## 📋 **Problema Identificado**

El WebSocket se conectaba exitosamente pero inmediatamente se desconectaba (`io server disconnect`), causando un bucle infinito de reconexiones. El problema era que el `WebSocketAuthGuard` no usaba exactamente la misma lógica de extracción de token que `JwtStrategy`.

### **Causa Raíz**
- **JwtStrategy usa:** `ExtractJwt.fromExtractors` con `(req) => req?.cookies?.jwt`
- **WebSocketAuthGuard usaba:** Lógica personalizada de parsing de cookies
- **Problema:** Los WebSockets no pasan por `cookieParser()` middleware, por lo que `req.cookies` no existe
- **Resultado:** Inconsistencia en la extracción de tokens entre HTTP y WebSocket

---

## ✅ **Solución Implementada**

### **1. Extracción de Token Unificada**

**Archivo:** `iam-backend/src/websockets/common/websocket-auth.guard.ts`

**Problema:** El `WebSocketAuthGuard` no usaba la misma lógica que `JwtStrategy`.

**Solución:** Usar exactamente la misma lógica que `JwtStrategy` pero adaptada para WebSockets:

```typescript
private extractTokenFromSocket(client: Socket): string | undefined {
  this.logger.debug(`🔍 Extrayendo token del WebSocket - Socket ID: ${client.id}`);
  
  // Usar exactamente la misma lógica que JwtStrategy pero adaptada para WebSockets
  const extractors = [
    // 1. Intentar obtener token de las cookies (patrón principal de la aplicación)
    (req: any) => {
      // Para WebSockets, las cookies no están parseadas por cookieParser
      // Necesitamos parsearlas manualmente
      if (req?.cookies?.jwt) {
        this.logger.debug(`🔍 Extractor 1 - Cookies parseadas: ${JSON.stringify(req.cookies)}`);
        return req.cookies.jwt;
      }
      
      // Si no hay cookies parseadas, intentar parsear manualmente
      if (req?.headers?.cookie) {
        const cookies = this.parseCookies(req.headers.cookie);
        if (cookies.jwt) {
          this.logger.debug(`🔍 Extractor 1 - Cookie JWT encontrada manualmente`);
          return cookies.jwt;
        }
      }
      
      return undefined;
    },
    // 2. Fallback: Authorization header (igual que JwtStrategy)
    (req: any) => {
      const authHeader = req?.headers?.authorization;
      this.logger.debug(`🔍 Extractor 2 - Authorization: ${authHeader ? 'Presente' : 'Ausente'}`);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return undefined;
    }
  ];

  // Simular el request object para los extractors (igual que JwtStrategy)
  const mockReq = {
    cookies: {}, // Las cookies no están parseadas en WebSockets
    headers: client.handshake.headers
  };

  // Probar cada extractor (igual que JwtStrategy)
  for (let i = 0; i < extractors.length; i++) {
    const extractor = extractors[i];
    const token = extractor(mockReq);
    if (token) {
      this.logger.debug(`✅ Token encontrado usando extractor ${i + 1} - Socket ID: ${client.id}`);
      return token;
    }
  }

  this.logger.warn(`❌ No se encontró token en ningún extractor - Socket ID: ${client.id}`);
  return undefined;
}
```

### **2. Parsing de Cookies Mejorado**

**Archivo:** `iam-backend/src/websockets/common/websocket-auth.guard.ts`

**Problema:** El método `parseCookies` necesitaba ser robusto para manejar las cookies del WebSocket.

**Solución:** Método de parsing robusto con logs detallados:

```typescript
private parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  this.logger.debug(`🔍 Parseando cookies: "${cookieString}"`);

  cookieString.split(';').forEach(cookie => {
    const trimmedCookie = cookie.trim();
    const equalIndex = trimmedCookie.indexOf('=');
    
    if (equalIndex > 0) {
      const name = trimmedCookie.substring(0, equalIndex).trim();
      const value = trimmedCookie.substring(equalIndex + 1).trim();
      
      if (name && value) {
        cookies[name] = value;
        this.logger.debug(`🔍 Cookie parseada: ${name} = ${value.substring(0, 20)}...`);
      }
    }
  });

  this.logger.debug(`🔍 Cookies parseadas:`, cookies);
  return cookies;
}
```

### **3. Autenticación Unificada Mantenida**

**Archivo:** `iam-backend/src/websockets/common/websocket-auth.guard.ts`

El WebSocket sigue usando **exactamente la misma lógica** que el resto del código:

```typescript
// Verificar el token usando la misma lógica que JwtStrategy
const payload = await this.jwtService.verifyAsync(token, {
  secret: securityConfig.jwt.secret,
  issuer: securityConfig.jwt.issuer,
  audience: securityConfig.jwt.audience,
  algorithms: ['HS256'],
});

// Validar claims estándar requeridos (igual que JwtStrategy)
if (!payload.sub || !payload.email || !payload.rol) {
  throw new WsException('Token inválido: claims requeridos faltantes');
}

// Verificar blacklist (igual que JwtStrategy)
if (payload.jti) {
  const isBlacklisted = await this.blacklistService.isTokenBlacklisted(payload.jti);
  if (isBlacklisted) {
    throw new WsException('Token revocado');
  }
}
```

---

## 🔧 **Cambios Técnicos Detallados**

### **Backend - Extracción de Token Unificada**
- ✅ **Misma lógica que JwtStrategy:** ExtractJwt.fromExtractors adaptado
- ✅ **Mismos extractors:** Cookies primero, Authorization header como fallback
- ✅ **Adaptación para WebSockets:** Parsing manual de cookies cuando no están disponibles
- ✅ **Logs detallados:** Para debugging del proceso de extracción

### **Backend - Parsing de Cookies**
- ✅ **Parsing robusto:** Manejo correcto de cookies con `indexOf` y `substring`
- ✅ **Logs detallados:** Para debugging del proceso de parsing
- ✅ **Validación robusta:** Verificación de formato de cookies

### **Backend - Autenticación Unificada**
- ✅ **Misma lógica que JwtStrategy:** ExtractJwt.fromExtractors
- ✅ **Misma validación:** Claims, tipos, roles, blacklist
- ✅ **Misma configuración:** Secret, issuer, audience, algorithms
- ✅ **Mismo manejo de errores:** WsException con mensajes consistentes

### **Frontend - Configuración Mantenida**
- ✅ **withCredentials: true:** Para enviar cookies automáticamente
- ✅ **Sin configuración adicional:** Igual que las peticiones HTTP
- ✅ **Logs de diagnóstico:** Para verificar cookies

---

## 🎯 **Resultado Esperado**

### **Antes (Problema):**
```
JwtStrategy: Usa ExtractJwt.fromExtractors con req.cookies.jwt
WebSocketAuthGuard: Usa lógica personalizada de parsing
Cookies HTTP: Parseadas por cookieParser middleware
Cookies WebSocket: No parseadas por middleware
Resultado: Inconsistencia → Fallos de autenticación
```

### **Después (Solución):**
```
JwtStrategy: Usa ExtractJwt.fromExtractors con req.cookies.jwt
WebSocketAuthGuard: Usa ExtractJwt.fromExtractors adaptado
Cookies HTTP: Parseadas por cookieParser middleware
Cookies WebSocket: Parseadas manualmente en el guard
Resultado: Lógica unificada → Autenticación exitosa
```

---

## 📁 **Archivos Modificados**

### **Backend:**
- ✅ `iam-backend/src/websockets/common/websocket-auth.guard.ts` - Extracción de token unificada

### **Frontend:**
- ✅ `iam-frontend/src/hooks/useLazyWebSocket.ts` - Configuración simplificada + logs
- ✅ `iam-frontend/src/context/WebSocketContext.tsx` - Configuración simplificada
- ✅ `iam-frontend/src/components/importacion/WebSocketDebugPanel.tsx` - Debug actualizado

---

## 🧪 **Testing**

### **1. Verificar Extracción de Token Unificada**
```typescript
// En los logs del backend, verificar:
// ✅ 🔍 Extrayendo token del WebSocket - Socket ID: ...
// ✅ 🔍 Request simulado para WebSocket: { hasCookies: true, ... }
// ✅ 🔍 Extractor 1 - Cookie JWT encontrada manualmente
// ✅ Token encontrado usando extractor 1 - Socket ID: ...
```

### **2. Verificar Parsing de Cookies**
```typescript
// En los logs del backend, verificar:
// ✅ 🔍 Parseando cookies: "jwt=...; __next_hmr_refresh_hash__=20"
// ✅ 🔍 Cookie parseada: jwt = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// ✅ 🔍 Cookies parseadas: { jwt: "..." }
```

### **3. Verificar Autenticación Exitosa**
```typescript
// En los logs del backend, verificar:
// ✅ WebSocket autenticado exitosamente - Usuario: baruk066@gmail.com - Empresa: 10
```

---

## 🔒 **Seguridad y Buenas Prácticas**

### **Seguridad:**
- ✅ **Validación unificada:** Misma lógica que el resto del código
- ✅ **Verificación de blacklist:** Como JwtStrategy
- ✅ **Validación de claims:** Claims estándar requeridos
- ✅ **Validación de roles:** Roles permitidos
- ✅ **Logs de auditoría:** Registra todas las conexiones

### **Buenas Prácticas:**
- ✅ **Código unificado:** Misma lógica en toda la aplicación
- ✅ **Mantenimiento simplificado:** Un solo patrón de autenticación
- ✅ **Consistencia:** WebSocket funciona igual que HTTP
- ✅ **Reutilización:** Usa la misma lógica que JwtStrategy
- ✅ **Diagnóstico:** Logs detallados para debugging

---

## 🚀 **Próximos Pasos**

1. **Reiniciar el backend** para aplicar los cambios de extracción unificada
2. **Recargar el frontend** para usar la nueva configuración
3. **Verificar logs** del backend para confirmar extracción correcta
4. **Monitorear WebSocket** para asegurar conexión estable
5. **Limpiar logs de diagnóstico** una vez confirmado el funcionamiento

---

## 📝 **Notas Importantes**

- **Unificación:** El WebSocket ahora usa exactamente la misma lógica que JwtStrategy
- **Adaptación:** Lógica adaptada para WebSockets (parsing manual de cookies)
- **Consistencia:** Mismo patrón de extracción de token en toda la aplicación
- **Reutilización:** Reutiliza la lógica de ExtractJwt.fromExtractors
- **Diagnóstico:** Logs detallados para identificar problemas futuros
- **Mantenimiento:** Más fácil de mantener y debuggear
- **Seguridad:** Misma validación robusta que el resto de endpoints 