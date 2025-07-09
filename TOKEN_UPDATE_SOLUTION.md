# Solución: Actualización de Token después del Setup de Empresa

## Problema Identificado

Cuando un usuario completaba el setup de empresa, el backend retornaba un nuevo token con la información de `empresaId` y `rol`, pero el frontend no actualizaba este token en las cookies. Esto causaba que las siguientes peticiones siguieran usando el token anterior (sin `empresaId`), resultando en errores 403.

## Solución Implementada

### Enfoque: Backend establece la cookie automáticamente

**Razones para elegir este enfoque:**
- ✅ **Seguridad**: El backend controla las cookies, no el frontend
- ✅ **Consistencia**: Sigue el mismo patrón que login/logout
- ✅ **Simplicidad**: El frontend no necesita manejar tokens directamente
- ✅ **Compatibilidad**: Evita problemas de CORS y políticas de cookies

### Cambios Realizados

#### 1. Backend - Controlador de Auth (`auth.controller.ts`)

```typescript
@Post('setup-empresa')
@HttpCode(200)
@UseGuards(AuthGuard('jwt'))
async setupEmpresa(
  @Body() dto: SetupEmpresaDto, 
  @CurrentUser() user: JwtUser,
  @Res({ passthrough: true }) res: Response
) {
  const result = await this.authService.setupEmpresa(user.id, dto);
  
  // Establecer la cookie con el nuevo token automáticamente
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN || (isProduction ? '.iaminventario.com.mx' : 'localhost');
  
  const cookieOptions: any = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    domain: cookieDomain,
    path: '/',
  };
  
  res.cookie('jwt', result.token, cookieOptions);
  
  // Log de auditoría para la actualización de cookie
  this.authService['jwtAuditService'].logJwtEvent('SETUP_COOKIE_UPDATED', user.id, user.email, {
    action: 'setup_empresa_cookie_update',
    empresaId: result.empresa.id,
    empresaName: result.empresa.nombre,
    userAgent: res.req?.headers['user-agent'],
    ip: res.req?.ip,
  });
  
  return result;
}
```

#### 2. Frontend - Sin cambios necesarios

El frontend mantiene su implementación simple:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!validateForm()) return

  setIsSubmitting(true)
  try {
    await apiClient.post('/auth/setup-empresa', formData)
    onSetupComplete()
  } catch (error) {
    console.error('Error configurando empresa:', error)
    setErrors({ 
      submit: error instanceof Error ? error.message : 'Error al configurar empresa' 
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

## Flujo de Funcionamiento

1. **Usuario completa setup de empresa**
2. **Backend procesa la solicitud**:
   - Crea la empresa en la base de datos
   - Actualiza el usuario con `empresaId` y `rol`
   - Genera un nuevo JWT con la información actualizada
   - Establece automáticamente la cookie con el nuevo token
   - Registra el evento en los logs de auditoría
3. **Frontend recibe confirmación** y actualiza la UI
4. **Siguientes peticiones** usan automáticamente el nuevo token con `empresaId`

## Medidas de Seguridad Implementadas

### 1. Auditoría Completa
- Log de inicio de setup
- Log de setup completado exitosamente
- Log de actualización de cookie
- Log de errores en setup

### 2. Transacciones de Base de Datos
- Uso de transacciones para prevenir race conditions
- Nivel de aislamiento `Serializable` (más alto)
- Timeouts configurados para evitar bloqueos

### 3. Validaciones
- Verificación de que el usuario no tenga empresa ya configurada
- Validación de RFC único (si se proporciona)
- Verificación de existencia del usuario

### 4. Configuración de Cookies Segura
- `httpOnly: true` - Previene acceso desde JavaScript
- `secure: true` en producción - Solo HTTPS
- `sameSite` configurado según entorno
- Dominio configurable para diferentes entornos

## Pruebas

Se incluye un script de prueba (`test-setup-token-update.js`) que verifica:

1. ✅ Registro de usuario
2. ✅ Estado inicial (necesita setup)
3. ✅ Token antes del setup (sin empresaId)
4. ✅ Setup de empresa
5. ✅ Nuevo token recibido (con empresaId)
6. ✅ Token anterior ya no funciona
7. ✅ Acceso a recursos protegidos con nuevo token

## Beneficios de la Solución

1. **Seguridad Mejorada**: El backend controla las cookies
2. **Simplicidad**: El frontend no maneja tokens directamente
3. **Consistencia**: Mismo patrón que login/logout
4. **Auditoría**: Logs completos de todas las operaciones
5. **Robustez**: Transacciones de BD y manejo de errores
6. **Escalabilidad**: Configuración flexible para diferentes entornos

## Consideraciones Futuras

1. **Refresh Tokens**: Considerar implementar refresh tokens para mayor seguridad
2. **Revocación de Tokens**: Implementar sistema de revocación de tokens
3. **Rate Limiting**: Aplicar rate limiting específico al setup de empresa
4. **Notificaciones**: Enviar notificaciones cuando se complete el setup 