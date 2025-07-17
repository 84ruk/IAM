# 📧 Configuración de SendGrid para IAM Inventario

## 🔧 Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# SendGrid Email Configuration
SENDGRID_API_KEY="tu-api-key-de-sendgrid"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
FROM_EMAIL="noreply@tuempresa.com"

# Frontend URL (para enlaces en emails)
FRONTEND_URL="http://localhost:3000"
```

## 🚀 Configuración de SendGrid

### 1. Crear cuenta en SendGrid
1. Ve a [sendgrid.com](https://sendgrid.com)
2. Crea una cuenta gratuita (permite 100 emails/día)
3. Verifica tu dominio de email

### 2. Obtener API Key
1. En el dashboard de SendGrid, ve a **Settings > API Keys**
2. Crea una nueva API Key con permisos de **Mail Send**
3. Copia la API Key generada

### 3. Configurar Dominio Remitente
1. Ve a **Settings > Sender Authentication**
2. Configura **Single Sender Verification** o **Domain Authentication**
3. Usa el email verificado en `FROM_EMAIL`

### 4. Configurar Webhooks (Opcional)
Para tracking de emails:
1. Ve a **Settings > Mail Settings**
2. Habilita **Event Webhook**
3. Configura la URL de tu webhook

## 📧 Tipos de Emails Implementados

### 1. Recuperación de Contraseña
- **Trigger**: Usuario solicita reset de contraseña
- **Destinatarios**: Usuario específico
- **Frecuencia**: Una vez por solicitud

### 2. Email de Bienvenida
- **Trigger**: Nuevo usuario registrado
- **Destinatarios**: Usuario nuevo
- **Frecuencia**: Una vez por registro

### 3. Stock Crítico
- **Trigger**: Producto alcanza stock mínimo
- **Destinatarios**: Admins de la empresa
- **Frecuencia**: Inmediata

### 4. Predicción de Quiebre
- **Trigger**: Sistema predice quiebre de stock
- **Destinatarios**: Admins de la empresa
- **Frecuencia**: Una vez por predicción

### 5. Alerta de Sensor
- **Trigger**: Sensor detecta condición anómala
- **Destinatarios**: Admins de la empresa
- **Frecuencia**: Cada hora mientras persista

### 6. Producto por Caducar
- **Trigger**: Producto próximo a caducar
- **Destinatarios**: Admins de la empresa
- **Frecuencia**: Diaria hasta resolución

### 7. KPI Fuera de Rango
- **Trigger**: KPI sale del rango esperado
- **Destinatarios**: Admins de la empresa
- **Frecuencia**: Una vez por anomalía

## 🎨 Plantillas de Email

Las plantillas están construidas con **MJML** y incluyen:

- **Branding IAM**: Logo y colores corporativos
- **Responsive Design**: Se adapta a móviles y desktop
- **Call-to-Action**: Botones para acciones específicas
- **Información Detallada**: Datos relevantes del evento
- **Versión Texto**: Fallback para clientes de email básicos

### Estructura de Plantillas

```
src/notifications/templates/
├── email-templates.service.ts  # Servicio principal
└── base-template.mjml         # Plantilla base (opcional)
```

## 🔧 Configuración de Alertas

### Endpoints Disponibles

```
GET  /notifications/config          # Obtener configuración
POST /notifications/config          # Crear configuración
PUT  /notifications/config/:id      # Actualizar configuración
DELETE /notifications/config/:id    # Eliminar configuración

GET  /notifications/history         # Historial de alertas
GET  /notifications/stats           # Estadísticas
GET  /notifications/summary         # Resumen de alertas

POST /notifications/test-email      # Enviar email de prueba
```

### Configuración por Tipo de Alerta

```json
{
  "tipoAlerta": "stock-critical",
  "destinatarios": ["admin@empresa.com", "gerente@empresa.com"],
  "activo": true,
  "frecuencia": "INMEDIATA",
  "horarioInicio": "08:00",
  "horarioFin": "18:00"
}
```

## 📊 Monitoreo y Estadísticas

### Métricas Disponibles
- **Total de emails enviados**
- **Emails exitosos vs fallidos**
- **Alertas por tipo**
- **Alertas por severidad**
- **Alertas últimas 24h**

### Historial de Alertas
- **Fecha y hora de envío**
- **Tipo y severidad**
- **Producto afectado**
- **Destinatarios**
- **Estado de envío**
- **Condiciones de activación**

## 🛠️ Troubleshooting

### Problemas Comunes

1. **Emails no se envían**
   - Verificar API Key de SendGrid
   - Verificar configuración SMTP
   - Revisar logs del servidor

2. **Emails van a spam**
   - Configurar SPF/DKIM en SendGrid
   - Verificar dominio remitente
   - Usar contenido relevante

3. **Plantillas no se renderizan**
   - Verificar sintaxis MJML
   - Revisar variables pasadas
   - Verificar encoding UTF-8

### Logs de Debug

```bash
# Ver logs de notificaciones
npm run start:dev | grep "NotificationService"

# Ver logs de SendGrid
npm run start:dev | grep "mailer"
```

## 🔒 Seguridad

### Buenas Prácticas
- **API Key segura**: Nunca committear en código
- **Rate Limiting**: Configurar límites de envío
- **Validación**: Verificar emails de destinatarios
- **Logs**: Mantener registro de envíos
- **Fallback**: Manejar errores de envío

### Configuración de Seguridad
```env
# Límites de envío
RATE_LIMIT_EMAILS_PER_HOUR="100"
RATE_LIMIT_EMAILS_PER_DAY="1000"

# Configuración de seguridad
EMAIL_MAX_RETRIES="3"
EMAIL_TIMEOUT="10000"
```

## 📈 Escalabilidad

### Para Producción
1. **Upgrade SendGrid**: Plan pagado para más emails
2. **Webhooks**: Implementar tracking de eventos
3. **Templates Dinámicos**: Usar SendGrid Dynamic Templates
4. **Analytics**: Implementar métricas avanzadas
5. **A/B Testing**: Probar diferentes plantillas

### Optimizaciones
- **Caching**: Cachear configuraciones de alertas
- **Batch Sending**: Enviar emails en lotes
- **Queue System**: Usar colas para envíos masivos
- **CDN**: Servir imágenes desde CDN 