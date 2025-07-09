# Botón de Cerrar Sesión en Página de Setup

## Descripción

Se ha agregado un botón de cerrar sesión en la página de configuración de empresa para permitir que los usuarios puedan salir del sistema en cualquier momento durante el proceso de setup.

## Características

### 🎯 **Funcionalidad Principal**
- **Logout seguro** desde cualquier paso del setup
- **Limpieza de cookies** automática
- **Redirección** inmediata a `/login`
- **Manejo de errores** robusto

### 📱 **Diseño Responsivo**
- **Desktop**: "Cerrar sesión" (texto completo)
- **Móvil**: "Salir" (texto abreviado)
- **Icono**: LogOut de Lucide React
- **Posición**: Esquina superior derecha del header

### 🔒 **Seguridad**
- **Llamada al endpoint** `/auth/logout`
- **Limpieza de cookies** JWT
- **Invalidación de token** en el backend
- **Redirección forzada** incluso si hay errores

## Implementación

### Código del Botón
```typescript
// Función de logout
const handleLogout = async () => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Redirigir de todas formas
    router.push('/login');
  }
};

// Botón en el header
<Button
  variant="outline"
  onClick={handleLogout}
  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50 whitespace-nowrap"
>
  <LogOut className="w-4 h-4" />
  <span className="hidden sm:inline">Cerrar sesión</span>
  <span className="sm:hidden">Salir</span>
</Button>
```

### Estructura del Header
```typescript
<div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
  <div className="text-center sm:text-left flex-1">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
      Configura tu empresa
    </h1>
    <p className="text-gray-600 text-sm sm:text-base">
      Completa estos pasos para comenzar a usar el sistema
    </p>
  </div>
  {/* Botón de logout aquí */}
</div>
```

## Flujo de Usuario

### 1. **Acceso a la Página**
```
Usuario → /setup-empresa → Ve botón "Cerrar sesión"
```

### 2. **Clic en Logout**
```
Usuario hace clic → handleLogout() → POST /auth/logout
```

### 3. **Procesamiento**
```
Backend → Limpia cookies → Invalida token → Responde 200
```

### 4. **Redirección**
```
Frontend → router.push('/login') → Página de login
```

## Casos de Uso

### ✅ **Casos Válidos**
- Usuario decide no completar el setup
- Usuario quiere cambiar de cuenta
- Usuario tiene problemas técnicos
- Usuario se arrepiente del registro

### 🛡️ **Manejo de Errores**
- **Error de red**: Redirección forzada a login
- **Error del servidor**: Redirección forzada a login
- **Token inválido**: Redirección forzada a login
- **Timeout**: Redirección forzada a login

## Testing

### Script de Prueba
```bash
node test-setup-logout.js
```

### Verificaciones
1. ✅ Botón visible en el header
2. ✅ Funciona en desktop y móvil
3. ✅ Logout exitoso
4. ✅ Token invalido después del logout
5. ✅ Redirección a login
6. ✅ Manejo de errores

## Beneficios

### Para el Usuario
- ✅ **Control total** sobre el proceso
- ✅ **Salida fácil** si cambia de opinión
- ✅ **Experiencia consistente** con el resto de la app
- ✅ **Seguridad** al cerrar sesión correctamente

### Para el Sistema
- ✅ **Limpieza de sesiones** no completadas
- ✅ **Seguridad mejorada** con logout explícito
- ✅ **Menos sesiones huérfanas** en la base de datos
- ✅ **Auditoría completa** de acciones del usuario

## Consideraciones Técnicas

### Seguridad
- **Llamada al endpoint** de logout del backend
- **Limpieza de cookies** httpOnly
- **Invalidación de token** en el servidor
- **Redirección segura** a login

### UX/UI
- **Posición consistente** con el resto de la app
- **Texto adaptativo** según el dispositivo
- **Estilo coherente** con el diseño general
- **Feedback visual** en hover

### Performance
- **Llamada asíncrona** no bloquea la UI
- **Redirección inmediata** después del logout
- **Manejo de errores** sin interrumpir el flujo

## Próximas Mejoras

1. **Confirmación**: Diálogo de confirmación antes del logout
2. **Analytics**: Tracking de logouts durante setup
3. **Persistencia**: Guardar progreso antes del logout
4. **Notificaciones**: Mensaje de "sesión cerrada exitosamente"

## Conclusión

El botón de cerrar sesión en la página de setup mejora significativamente la experiencia del usuario al proporcionar una salida clara y segura del proceso de configuración. Esto es especialmente importante para usuarios que pueden cambiar de opinión o tener problemas técnicos durante el setup. 