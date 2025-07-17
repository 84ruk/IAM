# 🚀 Configuración Final: SendGrid + Twilio

## 📋 Resumen de lo que necesitas configurar

### 1. **Variables de Entorno (.env)**

```bash
# ========================================
# CONFIGURACIÓN DE EMAIL (SENDGRID)
# ========================================
# Configuración SendGrid usando API oficial (recomendado)
SENDGRID_API_KEY="SG.tu_api_key_de_sendgrid_aqui"
SENDGRID_FROM_EMAIL="tu_email_verificado@tudominio.com"
SENDGRID_FROM_NAME="IAM Sistema de Inventarios"

# Configuración SMTP (alternativa, no recomendada)
# SMTP_HOST="smtp.sendgrid.net"
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER="apikey"
# SMTP_PASS="tu_sendgrid_api_key"
# EMAIL_FROM="tu_email_verificado@tudominio.com"
# EMAIL_FROM_NAME="IAM Sistema de Inventarios"

# ========================================
# CONFIGURACIÓN DE SMS (TWILIO)
# ========================================
TWILIO_ACCOUNT_SID="AC1234567890abcdef1234567890abcdef"
TWILIO_AUTH_TOKEN="tu_auth_token_de_twilio"
TWILIO_PHONE_NUMBER="+1234567890"

# ========================================
# CONFIGURACIÓN DE NOTIFICACIONES
# ========================================
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true
ALERT_CHECK_INTERVAL=300000
ALERT_BATCH_SIZE=10
EMAIL_RETRY_ATTEMPTS=3
SMS_RETRY_ATTEMPTS=2
RETRY_DELAY=5000

# ========================================
# OPCIONAL: Para pruebas
# ========================================
TEST_PHONE_NUMBER="+1234567890"  # Tu número para recibir SMS de prueba
```

## 🔧 Pasos de Configuración

### **SendGrid (Email)**

1. **Crear cuenta**: [sendgrid.com](https://sendgrid.com)
2. **Verificar email**: Confirma tu email de remitente
3. **Crear API Key**: Settings → API Keys → Create API Key
4. **Configurar variables**: Usa la API Key como `SENDGRID_API_KEY`

### **Twilio (SMS)**

1. **Crear cuenta**: [twilio.com](https://twilio.com)
2. **Obtener credenciales**: Dashboard → Account Info
3. **Verificar número**: Confirma tu número de teléfono
4. **Configurar variables**: Usa Account SID, Auth Token y número

## 🧪 Probar la Configuración

```bash
# Ejecutar script de prueba
node scripts/test-sendgrid-twilio.js
```

Este script verificará:
- ✅ Configuración de SendGrid
- ✅ Configuración de Twilio
- ✅ Envío de email de prueba
- ✅ Envío de SMS de prueba (si configuras TEST_PHONE_NUMBER)

## 📊 Límites y Costos

### **SendGrid**
- **Plan Gratuito**: 100 emails/día
- **Plan Essentials**: $14.95/mes - 50,000 emails/mes
- **Deliverability**: 99%+ tasa de entrega

### **Twilio**
- **Cuenta Gratuita**: $15 de crédito
- **SMS**: ~$0.0075 por mensaje
- **Verificación**: Número debe estar verificado

## 🎯 Tipos de Alertas Disponibles

1. **Stock Crítico** - Cuando el stock está bajo el mínimo
2. **Predicción de Quiebre** - Cuando se predice quiebre de stock
3. **Alertas de Sensores** - Temperatura, humedad, etc.
4. **Productos por Caducar** - Alertas de vencimiento
5. **KPIs fuera de Rango** - Métricas críticas

## 🔔 Endpoints de Prueba

### **Test Email**
```bash
curl -X POST http://localhost:3001/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "email": "tu_email@gmail.com",
    "tipo": "welcome"
  }'
```

### **Test SMS**
```bash
curl -X POST http://localhost:3001/notifications/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "phone": "+1234567890",
    "message": "Test SMS desde IAM"
  }'
```

## 📈 Dashboard de Alertas

Una vez configurado, podrás:

1. **Configurar alertas** en `/dashboard/alertas`
2. **Ver historial** de notificaciones enviadas
3. **Personalizar destinatarios** por tipo de alerta
4. **Monitorear estadísticas** de envío

## ⚠️ Notas Importantes

### **Seguridad**
- ✅ Nunca commitees el archivo `.env`
- ✅ Rota las API keys regularmente
- ✅ Monitorea el uso de las APIs

### **Deliverability**
- ✅ Verifica tu dominio en SendGrid
- ✅ Usa emails verificados como remitente
- ✅ Respeta las regulaciones anti-spam

### **Escalabilidad**
- ✅ SendGrid escala automáticamente
- ✅ Twilio maneja alta concurrencia
- ✅ Sistema preparado para producción

## 🚀 Próximos Pasos

1. **Configura las variables** en tu `.env`
2. **Ejecuta el script de prueba**
3. **Verifica que recibas email y SMS**
4. **Configura alertas en el dashboard**
5. **¡Listo para producción!**

## 📞 Soporte

- **SendGrid**: [Documentación](https://sendgrid.com/docs/)
- **Twilio**: [Documentación](https://www.twilio.com/docs/)
- **IAM Sistema**: Revisa los logs para debugging

---

**¡Tu sistema de notificaciones está listo para funcionar! 🎉** 