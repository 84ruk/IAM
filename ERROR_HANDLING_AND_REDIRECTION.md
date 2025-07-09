# Sistema de Manejo de Errores y Redirección Automática

## Problema Identificado

El error 403 "Se requiere configurar una empresa para acceder a este recurso" indica que el usuario está logueado correctamente pero no ha completado el setup de su empresa. Este es un flujo normal del sistema, pero necesitaba mejor manejo en el frontend.

## Solución Implementada

### 1. **Manejo Automático en el Cliente API** (`iam-frontend/src/lib/api.ts`)

Se agregó un interceptor que detecta automáticamente errores específicos:

```typescript
// Error 403 específico de empresa requerida
if (error.statusCode === 403) {
  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes('configurar una empresa') || 
      errorMessage.includes('empresa requerida') ||
      errorMessage.includes('needs setup')) {
    
    // Redirigir automáticamente a setup
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/setup-empresa')) {
      window.location.href = '/setup-empresa';
      return Promise.reject(new AppError('Redirigiendo a setup de empresa', 403));
    }
  }
}
```

### 2. **Verificación Post-Login** (`iam-frontend/src/components/auth/LoginForm.tsx`)

Después del login exitoso, se verifica automáticamente si el usuario necesita setup:

```typescript
// Verificar si necesita setup después del login
const setupCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/needs-setup`, {
  credentials: 'include',
});

if (setupCheckResponse.ok) {
  const setupData = await setupCheckResponse.json();
  
  if (setupData.needsSetup) {
    // Redirigir a setup
    router.push('/setup-empresa');
  } else {
    // Ir al dashboard
    router.push('/dashboard');
  }
}
```

### 3. **Componente de Manejo Global de Errores** (`iam-frontend/src/components/ui/GlobalErrorHandler.tsx`)

Componente que muestra errores de forma amigable:

- **Error 403 (Empresa requerida)**: Modal con botón para ir a setup
- **Error 401 (No autenticado)**: Modal con botón para ir a login
- **Errores genéricos**: Modal con opción de reintentar

### 4. **Hook de Manejo Global** (`iam-frontend/src/hooks/useGlobalError.ts`)

Hook que proporciona funcionalidad para manejar errores globalmente:

```typescript
const { error, handleError, isEmpresaRequiredError, isAuthError } = useGlobalError();
```

## Flujo de Manejo de Errores

### **Escenario 1: Usuario logueado sin empresa configurada**

1. Usuario hace login exitosamente
2. Sistema verifica automáticamente si necesita setup
3. Si necesita setup → redirige a `/setup-empresa`
4. Si no necesita setup → redirige a `/dashboard`

### **Escenario 2: Usuario intenta acceder a recursos protegidos sin empresa**

1. Usuario navega a `/dashboard` o `/productos`
2. Backend devuelve error 403
3. Cliente API detecta el error automáticamente
4. Redirige automáticamente a `/setup-empresa`

### **Escenario 3: Usuario con sesión expirada**

1. Usuario intenta acceder a recursos protegidos
2. Backend devuelve error 401
3. Cliente API detecta el error automáticamente
4. Redirige automáticamente a `/login`

## Códigos de Error Manejados

### **403 - Empresa Requerida**
```json
{
  "message": "Se requiere configurar una empresa para acceder a este recurso",
  "code": "EMPRESA_REQUIRED",
  "needsSetup": true,
  "redirectTo": "/setup-empresa"
}
```

### **401 - No Autenticado**
```json
{
  "message": "Usuario no autenticado",
  "code": "AUTH_REQUIRED"
}
```

### **409 - Conflicto (Usuario ya existe)**
```json
{
  "message": "Ya existe una cuenta con este correo electrónico",
  "code": "USER_EXISTS"
}
```

## Implementación en Componentes

### **Uso del Hook Global**

```typescript
import { useGlobalError } from '@/hooks/useGlobalError';

function MyComponent() {
  const { error, handleError, clearError } = useGlobalError();

  const handleApiCall = async () => {
    try {
      const result = await apiClient.get('/productos');
      // Manejar resultado
    } catch (error) {
      handleError(error); // Manejo automático
    }
  };

  return (
    <div>
      {/* Contenido del componente */}
      <GlobalErrorHandler error={error} onRetry={handleApiCall} />
    </div>
  );
}
```

### **Uso del Componente GlobalErrorHandler**

```typescript
import GlobalErrorHandler from '@/components/ui/GlobalErrorHandler';

function DashboardPage() {
  const [error, setError] = useState(null);

  return (
    <div>
      {/* Contenido del dashboard */}
      <GlobalErrorHandler 
        error={error} 
        onRetry={() => {
          // Lógica de reintento
        }}
      />
    </div>
  );
}
```

## Beneficios de la Implementación

### ✅ **Experiencia de Usuario Mejorada**
- Redirección automática sin interrupciones
- Mensajes de error claros y amigables
- Flujo de setup guiado

### ✅ **Manejo Robusto de Errores**
- Detección automática de tipos de error
- Redirección inteligente según el contexto
- Prevención de bucles infinitos

### ✅ **Código Mantenible**
- Lógica centralizada en hooks y componentes
- Reutilizable en toda la aplicación
- Fácil de extender para nuevos tipos de error

### ✅ **Seguridad**
- Validación en frontend y backend
- Manejo seguro de tokens
- Prevención de acceso no autorizado

## Próximos Pasos Recomendados

1. **Testing**: Implementar tests para los diferentes escenarios de error
2. **Analytics**: Tracking de errores para mejorar la experiencia
3. **Internacionalización**: Preparar mensajes para múltiples idiomas
4. **Performance**: Optimizar las verificaciones automáticas
5. **Accesibilidad**: Mejorar la accesibilidad de los modales de error

## Conclusión

El sistema implementado proporciona un manejo robusto y automático de errores, especialmente para el caso común de usuarios que necesitan completar el setup de empresa. La experiencia de usuario es fluida y los errores se manejan de forma elegante sin interrumpir el flujo de trabajo. 