# 🔒 Guía de Seguridad - IAM System

## 📋 Resumen Ejecutivo

Esta guía establece las mejores prácticas de seguridad para el sistema IAM, incluyendo protección de credenciales, configuración de entornos, y procedimientos de auditoría.

## 🚨 Problemas Críticos de Seguridad

### ❌ **NUNCA hagas esto:**

1. **Commitees credenciales reales al repositorio**
   ```bash
   # ❌ MALO
   git add .env
   git commit -m "Add environment variables"
   
   # ✅ BUENO
   git add .env.example
   git commit -m "Add environment variables template"
   ```

2. **Hardcodear contraseñas en el código**
   ```typescript
   // ❌ MALO
   const password = "mi_contraseña_secreta";
   
   // ✅ BUENO
   const password = process.env.DB_PASSWORD;
   ```

3. **Usar credenciales de ejemplo en producción**
   ```env
   # ❌ MALO
   JWT_SECRET=tu_clave_secreta_muy_larga_y_compleja_aqui
   
   # ✅ BUENO
   JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Exponer archivos de configuración sensibles**
   ```bash
   # ❌ MALO
   chmod 644 .env
   
   # ✅ BUENO
   chmod 600 .env
   ```

## 🔐 Gestión de Credenciales

### **Generación de Claves Seguras**

```bash
# Generar JWT Secret (32 bytes)
openssl rand -base64 32

# Generar contraseña de base de datos
openssl rand -base64 16 | tr -d "=+/" | cut -c1-16

# Generar clave de encriptación
openssl rand -base64 32
```

### **Script Automatizado**

```bash
# Generar todas las claves necesarias
./generate-secrets.sh
```

### **Variables de Entorno Requeridas**

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/base_datos"

# JWT
JWT_SECRET="clave_secreta_de_32_caracteres_minimo"

# Servidor
PORT=3001
NODE_ENV="production"

# CORS
FRONTEND_URL="https://tu-dominio.com"

# Seguridad adicional
ENCRYPTION_KEY="clave_de_encriptacion"
HASH_SALT="salt_para_hashing"
```

## 🛡️ Configuración de Seguridad

### **Backend (NestJS)**

1. **Rate Limiting**
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';
   
   @Module({
     imports: [
       ThrottlerModule.forRoot([{
         ttl: 60000,
         limit: 10,
       }]),
     ],
   })
   ```

2. **CORS Configuration**
   ```typescript
   app.enableCors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
   });
   ```

3. **Helmet Security Headers**
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

4. **Validation Pipes**
   ```typescript
   app.useGlobalPipes(new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
   }));
   ```

### **Frontend (Next.js)**

1. **Environment Variables**
   ```typescript
   // Solo variables públicas
   NEXT_PUBLIC_API_URL="https://api.tudominio.com"
   
   // Variables privadas (solo en servidor)
   DATABASE_URL="postgresql://..."
   ```

2. **Content Security Policy**
   ```typescript
   // next.config.ts
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
     }
   ];
   ```

### **Base de Datos (PostgreSQL)**

1. **Índices de Seguridad**
   ```sql
   -- Índice único en email
   CREATE UNIQUE INDEX idx_users_email ON users(email);
   
   -- Índice en campos de auditoría
   CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
   ```

2. **Permisos de Usuario**
   ```sql
   -- Usuario con permisos limitados
   CREATE USER app_user WITH PASSWORD 'strong_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   ```

## 🔍 Auditoría de Seguridad

### **Script de Auditoría Automatizada**

```bash
# Ejecutar auditoría completa
./security-audit.sh
```

### **Verificaciones Manuales**

1. **Revisar archivos de configuración**
   ```bash
   # Verificar que .env no esté en git
   git status .env
   
   # Verificar permisos
   ls -la .env
   ```

2. **Buscar credenciales hardcodeadas**
   ```bash
   # Buscar en todo el código
   grep -r "password\|secret\|key" src/ --exclude-dir=node_modules
   ```

3. **Verificar dependencias**
   ```bash
   # Backend
   cd iam-backend && npm audit
   
   # Frontend
   cd iam-frontend && npm audit
   ```

## 🚀 Despliegue Seguro

### **Desarrollo Local**

```bash
# 1. Generar credenciales
./generate-secrets.sh

# 2. Configurar .env
cp .env.generated .env
# Editar .env con tus configuraciones

# 3. Ejecutar auditoría
./security-audit.sh

# 4. Desplegar
./deploy.sh
```

### **Producción**

```bash
# 1. Configurar variables de entorno
export DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"
export JWT_SECRET="$(openssl rand -base64 32)"
export FRONTEND_URL="https://tu-dominio.com"

# 2. Ejecutar auditoría
./security-audit.sh

# 3. Desplegar producción
./deploy-production.sh
```

## 📊 Monitoreo y Logging

### **Logs de Seguridad**

```typescript
// Backend - Logging de eventos de seguridad
@Injectable()
export class SecurityLogger {
  logLoginAttempt(userId: number, success: boolean, ip: string) {
    this.logger.log(`Login attempt: ${userId}, success: ${success}, IP: ${ip}`);
  }
  
  logSuspiciousActivity(activity: string, userId: number, ip: string) {
    this.logger.warn(`Suspicious activity: ${activity}, user: ${userId}, IP: ${ip}`);
  }
}
```

### **Alertas de Seguridad**

```typescript
// Configurar alertas para:
// - Múltiples intentos de login fallidos
// - Acceso desde IPs desconocidas
// - Cambios en roles de usuario
// - Eliminación de datos críticos
```

## 🔄 Rotación de Credenciales

### **Programa de Rotación**

1. **JWT Secret**: Cada 90 días
2. **Contraseñas de BD**: Cada 180 días
3. **Claves de API**: Cada 365 días
4. **Certificados SSL**: Según expiración

### **Script de Rotación**

```bash
# Generar nuevas credenciales
./generate-secrets.sh

# Actualizar en producción
# 1. Actualizar variables de entorno
# 2. Reiniciar servicios
# 3. Verificar funcionamiento
# 4. Eliminar credenciales antiguas
```

## 🆘 Incidentes de Seguridad

### **Procedimiento de Respuesta**

1. **Identificación**
   - Detectar el incidente
   - Documentar detalles
   - Notificar al equipo

2. **Contención**
   - Aislar sistemas afectados
   - Cambiar credenciales comprometidas
   - Activar alertas adicionales

3. **Eliminación**
   - Remover malware/backdoors
   - Parchear vulnerabilidades
   - Verificar integridad

4. **Recuperación**
   - Restaurar desde backups limpios
   - Verificar funcionamiento
   - Monitorear actividad

5. **Lecciones Aprendidas**
   - Documentar incidente
   - Actualizar procedimientos
   - Mejorar controles

### **Contactos de Emergencia**

```
Equipo de Seguridad: security@tuempresa.com
Administrador de Sistemas: admin@tuempresa.com
Soporte 24/7: +1-800-SECURITY
```

## 📚 Recursos Adicionales

### **Herramientas de Seguridad**

- **OWASP ZAP**: Análisis de vulnerabilidades
- **Snyk**: Monitoreo de dependencias
- **SonarQube**: Análisis de código
- **Vault**: Gestión de secretos

### **Estándares de Seguridad**

- **OWASP Top 10**: Vulnerabilidades web
- **NIST Cybersecurity Framework**
- **ISO 27001**: Gestión de seguridad de la información

### **Documentación**

- [OWASP Security Guidelines](https://owasp.org/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**🔒 Recuerda: La seguridad es responsabilidad de todos. Mantén siempre actualizada esta guía y reporta cualquier vulnerabilidad encontrada.** 