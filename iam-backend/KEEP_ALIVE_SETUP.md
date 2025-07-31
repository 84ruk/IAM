# 🚀 Configuración Keep-Alive para Fly.io

Este documento explica cómo configurar tu aplicación Fly.io para que **nunca se apague** y esté siempre disponible.

## 📋 Cambios Realizados

### 1. Configuración de Fly.io (`fly.toml`)

Se han modificado los siguientes parámetros:

```toml
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false    # ❌ Antes: true
  auto_start_machines = true
  min_machines_running = 1      # ❌ Antes: 0
  processes = ["app"]
```

**Explicación:**
- `auto_stop_machines = false`: Evita que Fly.io apague las máquinas por inactividad
- `min_machines_running = 1`: Mantiene al menos 1 máquina siempre ejecutándose

### 2. Scripts de Keep-Alive

Se han creado dos scripts para mantener la aplicación activa:

#### `scripts/keep-alive.js`
Script principal que hace pings periódicos a los endpoints de health check.

**Características:**
- ✅ Pings cada 5 minutos
- ✅ Verifica múltiples endpoints (`/health`, `/health/database`, `/health/complete`)
- ✅ Manejo de errores y reintentos
- ✅ Logs detallados
- ✅ Configuración flexible

#### `scripts/setup-keep-alive-cron.sh`
Script para configurar automáticamente un cron job.

**Comandos disponibles:**
- `./scripts/setup-keep-alive-cron.sh install` - Instalar cron job
- `./scripts/setup-keep-alive-cron.sh status` - Ver estado
- `./scripts/setup-keep-alive-cron.sh remove` - Remover cron job
- `./scripts/setup-keep-alive-cron.sh test` - Probar script

## 🛠️ Instalación y Configuración

### Opción 1: Usando el Script de Cron (Recomendado)

```bash
# Navegar al directorio del backend
cd iam-backend

# Configurar el cron job automáticamente
./scripts/setup-keep-alive-cron.sh install

# Verificar que se instaló correctamente
./scripts/setup-keep-alive-cron.sh status
```

### Opción 2: Ejecución Manual

```bash
# Ejecutar el script manualmente
npm run keep-alive

# O con logs detallados
npm run keep-alive:verbose
```

### Opción 3: Usando PM2 (Para desarrollo)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Ejecutar con PM2
pm2 start scripts/keep-alive.js --name "fly-keep-alive"

# Configurar para que se reinicie automáticamente
pm2 startup
pm2 save
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Puedes configurar el comportamiento usando variables de entorno:

```bash
# URL de tu aplicación Fly.io
export FLY_APP_URL="https://tu-app.fly.dev"

# Activar logs detallados
export VERBOSE="true"

# Ejecutar con configuración personalizada
VERBOSE=true FLY_APP_URL="https://tu-app.fly.dev" npm run keep-alive
```

### Personalizar Intervalos

Para cambiar el intervalo de ping, edita `scripts/keep-alive.js`:

```javascript
const config = {
  // Cambiar de 5 minutos a 3 minutos
  pingInterval: 3 * 60 * 1000,
  // ... resto de configuración
};
```

### Agregar Más Endpoints

Para verificar endpoints adicionales:

```javascript
const config = {
  endpoints: [
    '/health',
    '/health/database', 
    '/health/complete',
    '/api/status',        // Nuevo endpoint
    '/metrics'            // Nuevo endpoint
  ],
  // ... resto de configuración
};
```

## 📊 Monitoreo y Logs

### Ver Logs del Cron Job

```bash
# Ver logs en tiempo real
tail -f scripts/keep-alive-cron.log

# Ver últimas 50 líneas
tail -n 50 scripts/keep-alive-cron.log

# Buscar errores
grep "ERROR\|FAILED" scripts/keep-alive-cron.log
```

### Verificar Estado

```bash
# Verificar cron jobs activos
crontab -l

# Verificar logs de la aplicación
fly logs

# Verificar estado de la aplicación
fly status
```

## 🚨 Solución de Problemas

### El servidor sigue apagándose

1. **Verificar configuración de Fly.io:**
   ```bash
   fly config show
   ```

2. **Verificar que los cambios se aplicaron:**
   ```bash
   fly deploy
   ```

3. **Verificar logs del keep-alive:**
   ```bash
   tail -f scripts/keep-alive-cron.log
   ```

### El cron job no se ejecuta

1. **Verificar que el cron job está instalado:**
   ```bash
   crontab -l | grep keep-alive
   ```

2. **Verificar permisos del script:**
   ```bash
   ls -la scripts/keep-alive.js
   ```

3. **Probar el script manualmente:**
   ```bash
   node scripts/keep-alive.js
   ```

### Errores de conexión

1. **Verificar URL de la aplicación:**
   ```bash
   curl https://tu-app.fly.dev/health
   ```

2. **Verificar que los endpoints responden:**
   ```bash
   curl https://tu-app.fly.dev/health/database
   ```

## 💰 Consideraciones de Costo

### Fly.io Pricing

- **Máquinas siempre activas**: Se cobra por el tiempo completo de ejecución
- **Máquinas que se apagan**: Solo se cobra cuando están activas

### Optimización de Costos

1. **Usar máquinas más pequeñas:**
   ```toml
   [machine]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256  # Reducir de 512MB a 256MB
   ```

2. **Configurar escalado automático:**
   ```toml
   [http_service]
     min_machines_running = 1
     max_machines = 3
   ```

3. **Usar regiones más económicas:**
   ```toml
   primary_region = "dfw"  # Dallas es más económico
   ```

## 🔄 Actualización de la Configuración

Para aplicar los cambios a Fly.io:

```bash
# Desplegar los cambios
fly deploy

# Verificar el estado
fly status

# Ver logs en tiempo real
fly logs
```

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Verificar logs:** `fly logs`
2. **Verificar estado:** `fly status`
3. **Revisar configuración:** `fly config show`
4. **Reiniciar aplicación:** `fly restart`

## ✅ Checklist de Verificación

- [ ] Configuración `fly.toml` actualizada
- [ ] Script `keep-alive.js` creado y ejecutable
- [ ] Script `setup-keep-alive-cron.sh` creado y ejecutable
- [ ] Cron job instalado y funcionando
- [ ] Logs del keep-alive funcionando
- [ ] Aplicación desplegada en Fly.io
- [ ] Endpoints de health check respondiendo
- [ ] Monitoreo configurado

---

**¡Con esta configuración, tu servidor Fly.io nunca se apagará! 🎉** 