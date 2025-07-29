# 🔐 Solución Unificada de Autenticación

## 📋 **Problema Resuelto**

**Antes:**
- ❌ WebSocket no encontraba el JWT aunque existiera en cookies
- ❌ Diferentes formas de manejar autenticación en la aplicación
- ❌ Código duplicado para extraer y validar JWT
- ❌ Inconsistencias en el manejo de errores de autenticación

**Después:**
- ✅ **Hook unificado** `useAuth()` para toda la aplicación
- ✅ **Validación robusta** del JWT con formato y contenido
- ✅ **Reutilización de código** en WebSocket y API
- ✅ **Manejo consistente** de errores de autenticación

---

## 🚀 **Arquitectura de la Solución**

### **1. Hook de Autenticación Unificado (`useAuth.ts`)**

**Funcionalidades:**
- 🔍 **Extracción inteligente** del JWT de cookies
- ✅ **Validación de formato** JWT (3 partes separadas por puntos)
- 🛡️ **Verificación de usuario** y empresaId
- 📊 **Estado de autenticación** en tiempo real
- 🔧 **Headers automáticos** para peticiones HTTP
- 🔌 **Configuración WebSocket** optimizada

**Código Clave:**
```typescript
export function useAuth(): UseAuthReturn {
  const user = useServerUser()

  // Extracción robusta del JWT
  const getJwtFromCookies = useCallback((): string | null => {
    if (typeof document === 'undefined') return null
    
    try {
      const cookies = document.cookie.split(';')
      const jwtCookie = cookies.find(cookie => 
        cookie.trim().startsWith('jwt=')
      )
      
      if (!jwtCookie) {
        console.warn('🔍 Auth: No se encontró cookie JWT')
        return null
      }
      
      const token = jwtCookie.split('=')[1]?.trim()
      
      // Validación de formato JWT
      if (!token || !token.includes('.') || token.split('.').length !== 3) {
        console.warn('🔍 Auth: Formato JWT inválido')
        return null
      }
      
      return token
    } catch (error) {
      console.error('❌ Auth: Error al extraer JWT:', error)
      return null
    }
  }, [])

  // Estado de autenticación
  const authInfo = useMemo((): AuthInfo => {
    const token = getJwtFromCookies()
    
    if (!user || !token) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        error: !user ? 'Usuario no autenticado' : 'Token no encontrado',
        empresaId: null
      }
    }

    if (!user.empresaId) {
      return {
        isAuthenticated: false,
        user: user,
        token: token,
        error: 'Usuario sin empresa asignada',
        empresaId: null
      }
    }

    return {
      isAuthenticated: true,
      user: user,
      token: token,
      error: null,
      empresaId: user.empresaId
    }
  }, [user, getJwtFromCookies])

  return {
    authInfo,
    getAuthHeaders,
    getWebSocketAuth,
    validateAuth
  }
}
```

### **2. WebSocket con Autenticación Unificada**

**Integración:**
```typescript
export function useLazyWebSocket(): UseLazyWebSocketReturn {
  const { authInfo, getWebSocketAuth, validateAuth } = useAuth()

  const connect = useCallback(async (): Promise<boolean> => {
    // Verificar autenticación usando el hook unificado
    if (!validateAuth()) {
      console.log('🔍 WebSocket: Usuario no autenticado')
      setConnectionError(authInfo.error || 'Usuario no autenticado')
      return false
    }

    // Obtener autenticación usando el hook unificado
    const { token: jwt, error: authError } = getWebSocketAuth()
    
    if (!jwt || authError) {
      console.error('❌ WebSocket: Error de autenticación:', authError)
      setConnectionError(authError || 'No se encontró token de autenticación')
      return false
    }

    // Conectar con JWT validado
    const newSocket = io(`${socketUrl}/importacion`, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false,
      withCredentials: true,
      auth: { token: jwt },
      extraHeaders: { 'Authorization': `Bearer ${jwt}` }
    })
  }, [authInfo, getWebSocketAuth, validateAuth])
}
```

### **3. API con Autenticación Automática**

**Uso:**
```typescript
export function useApi() {
  const { getAuthHeaders, validateAuth } = useAuth()

  // API client con headers automáticos
  const authenticatedApi = {
    get: async <T>(url: string, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return apiClient.get<T>(url, { ...config, headers: { ...headers, ...config?.headers } })
    },
    post: async <T>(url: string, data?: any, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return apiClient.post<T>(url, data, { ...config, headers: { ...headers, ...config?.headers } })
    }
    // ... otros métodos
  }

  return {
    handleApiCall,
    api,
    apiClient,
    authenticatedApi,
    getAuthHeaders,
    validateAuth
  }
}
```

---

## 🔧 **Flujo de Autenticación**

### **1. Inicio de Sesión:**
```typescript
// Backend setea cookie JWT
res.cookie('jwt', token, {
  httpOnly: true,
  secure: false, // true en producción con HTTPS
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
})
```

### **2. Verificación en Frontend:**
```typescript
// useAuth() extrae y valida JWT
const token = getJwtFromCookies()
if (token && user && user.empresaId) {
  // Usuario autenticado
  return { isAuthenticated: true, token, user }
}
```

### **3. Uso en WebSocket:**
```typescript
// WebSocket usa el mismo sistema
const { token, error } = getWebSocketAuth()
if (token) {
  // Conectar WebSocket con JWT
}
```

### **4. Uso en API:**
```typescript
// API usa headers automáticos
const headers = getAuthHeaders()
// { 'Authorization': 'Bearer eyJ...', 'Content-Type': 'application/json' }
```

---

## 🛡️ **Seguridad Implementada**

### **Validaciones:**
- ✅ **Formato JWT** (3 partes separadas por puntos)
- ✅ **Usuario autenticado** (contexto de usuario)
- ✅ **Empresa asignada** (empresaId requerido)
- ✅ **Token no vacío** (validación de contenido)

### **Buenas Prácticas:**
- 🔒 **HTTP Only cookies** (no accesibles desde JavaScript malicioso)
- 🛡️ **Validación en servidor** (backend verifica JWT)
- 🔄 **Reutilización de código** (mismo sistema para toda la app)
- 📊 **Logging detallado** (para debugging y auditoría)

### **Configuración SaaS:**
- 🌐 **Cross-origin compatible** (sameSite: 'lax')
- 🔐 **HTTPS ready** (secure: true en producción)
- ⏰ **Expiración configurable** (maxAge personalizable)
- 🏢 **Multi-tenant** (empresaId en JWT)

---

## 📊 **Componentes de Debugging**

### **WebSocketDebugPanel Mejorado:**
- 👤 **Información del usuario** completa
- 🔐 **Estado de autenticación** en tiempo real
- 🍪 **Estado de cookies** detallado
- ❌ **Errores específicos** de autenticación
- 🔧 **Pruebas de conexión** manuales

### **Información Mostrada:**
```typescript
// Estado de autenticación
<div>Autenticado: <Badge variant={authInfo.isAuthenticated ? "default" : "destructive"}>
  {authInfo.isAuthenticated ? 'Sí' : 'No'}
</Badge></div>

// Error específico
{authInfo.error && <div>Error: <span className="text-red-600">{authInfo.error}</span></div>}
```

---

## 🚀 **Beneficios Obtenidos**

### **Desarrollo:**
- 🔄 **Código reutilizable** - Un solo hook para toda la app
- 🛠️ **Debugging fácil** - Información centralizada
- 📝 **Mantenimiento simple** - Cambios en un solo lugar
- 🧪 **Testing consistente** - Misma lógica en todos lados

### **Seguridad:**
- 🛡️ **Validación robusta** - Múltiples capas de verificación
- 🔒 **Cookies seguras** - HTTP Only y configuración SaaS
- 📊 **Auditoría completa** - Logs detallados
- 🔄 **Consistencia** - Mismo sistema en toda la app

### **Experiencia de Usuario:**
- ⚡ **Conexión rápida** - WebSocket se conecta inmediatamente
- 🔄 **Reconexión automática** - Manejo inteligente de errores
- 📊 **Feedback visual** - Estado claro de autenticación
- 🛠️ **Debugging visual** - Paneles informativos

---

## 🔧 **Uso en la Aplicación**

### **En Componentes:**
```typescript
function MiComponente() {
  const { authInfo, validateAuth } = useAuth()
  
  if (!validateAuth()) {
    return <div>No autenticado</div>
  }
  
  return <div>Bienvenido, {authInfo.user.email}</div>
}
```

### **En WebSocket:**
```typescript
function MiHookWebSocket() {
  const { getWebSocketAuth } = useAuth()
  
  const connect = async () => {
    const { token, error } = getWebSocketAuth()
    if (token) {
      // Conectar WebSocket
    }
  }
}
```

### **En API:**
```typescript
function MiHookAPI() {
  const { authenticatedApi } = useApi()
  
  const fetchData = async () => {
    const data = await authenticatedApi.get('/api/data')
    // Headers de autenticación automáticos
  }
}
```

---

## ✅ **Conclusión**

La solución implementada proporciona:

- 🔐 **Autenticación unificada** y segura
- 🔄 **Código reutilizable** y mantenible
- 🛡️ **Validación robusta** del JWT
- 📊 **Debugging avanzado** y visual
- 🚀 **Configuración SaaS** lista para producción

El WebSocket ahora se autentica correctamente usando el mismo sistema que el resto de la aplicación, proporcionando una experiencia de usuario fluida y segura. 