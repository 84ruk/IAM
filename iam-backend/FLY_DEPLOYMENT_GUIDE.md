# Guía de Deployment en Fly.io - Plantillas Automáticas

## 🚀 Problema Solucionado

**Error anterior:** Las plantillas no se encontraban en el deployment de Fly.io
```
[Nest] WARN [PlantillasAutoService] ⚠️ No se encontraron plantillas para productos
```

## ✅ Soluciones Implementadas

### 1. **Dockerfile Actualizado** ✅

Se agregó la generación automática de plantillas durante el build:

```dockerfile
# Genera las plantillas automáticamente durante el build
RUN node scripts/generate-plantillas-docker.js

# Copia el directorio uploads con las plantillas generadas
COPY --from=builder /app/uploads ./uploads
```

### 2. **Scripts de Generación Automática** ✅

- `scripts/generate-plantillas-docker.js` - Genera plantillas durante el build
- `scripts/init-plantillas.js` - Inicializa plantillas al arrancar la app
- `scripts/generate-plantillas-auto.js` - Genera plantillas con schema correcto

### 3. **Servicio Mejorado** ✅

El `PlantillasAutoService` ahora:
- Detecta automáticamente si faltan plantillas
- Las genera automáticamente si no existen
- Prioriza plantillas automáticas (`-auto.xlsx`)

### 4. **Inicialización al Arrancar** ✅

El `main.ts` ahora ejecuta la inicialización de plantillas después de que la app esté lista.

## 🔧 Comandos de Deployment

### **Deployment Normal:**
```bash
# Desde el directorio iam-backend
fly deploy
```

### **Deployment con Logs:**
```bash
# Deploy y ver logs en tiempo real
fly deploy --remote-only
fly logs --follow
```

### **Verificar Estado:**
```bash
# Verificar que la app está funcionando
fly status

# Ver logs recientes
fly logs

# Conectar a la app
fly ssh console
```

## 📋 Verificación Post-Deployment

### **1. Verificar Plantillas Generadas:**
```bash
# Conectar al contenedor
fly ssh console

# Verificar que las plantillas existen
ls -la uploads/plantillas/
```

**Deberías ver:**
```
plantilla-productos-auto.xlsx
plantilla-proveedores-auto.xlsx
plantilla-movimientos-auto.xlsx
```

### **2. Probar Endpoints:**
```bash
# Obtener todas las plantillas
curl https://tu-app.fly.dev/plantillas-auto

# Obtener mejor plantilla de productos
curl https://tu-app.fly.dev/plantillas-auto/productos/mejor

# Descargar plantilla específica
curl https://tu-app.fly.dev/plantillas-auto/productos/descargar/plantilla-productos-auto.xlsx
```

### **3. Verificar Logs:**
```bash
# Ver logs en tiempo real
fly logs --follow

# Buscar mensajes de plantillas
fly logs | grep -i plantilla
```

**Logs esperados:**
```
✅ Plantillas generadas automáticamente
✅ Plantilla automática para productos: plantilla-productos-auto.xlsx
```

## 🛠️ Troubleshooting

### **Problema: Plantillas no se generan**
```bash
# Verificar que el script existe
fly ssh console
ls -la scripts/generate-plantillas-auto.js

# Ejecutar manualmente
node scripts/generate-plantillas-auto.js
```

### **Problema: Directorio uploads no existe**
```bash
# Crear directorio manualmente
fly ssh console
mkdir -p uploads/plantillas
node scripts/generate-plantillas-auto.js
```

### **Problema: Permisos de archivos**
```bash
# Verificar permisos
fly ssh console
ls -la uploads/plantillas/
chmod 644 uploads/plantillas/*.xlsx
```

## 📊 Estructura de Archivos en Fly.io

```
/app/
├── dist/                    # Código compilado
├── uploads/                 # Directorio de uploads
│   └── plantillas/         # Plantillas generadas
│       ├── plantilla-productos-auto.xlsx
│       ├── plantilla-proveedores-auto.xlsx
│       └── plantilla-movimientos-auto.xlsx
├── scripts/                # Scripts de generación
│   ├── generate-plantillas-auto.js
│   ├── generate-plantillas-docker.js
│   └── init-plantillas.js
└── package.json
```

## 🔄 Proceso de Deployment

### **1. Build Stage:**
- ✅ Copia código fuente
- ✅ Instala dependencias
- ✅ Genera plantillas automáticamente
- ✅ Compila TypeScript

### **2. Runtime Stage:**
- ✅ Copia archivos necesarios
- ✅ Incluye directorio `uploads/` con plantillas
- ✅ Ejecuta aplicación
- ✅ Inicializa plantillas al arrancar

### **3. Runtime Verification:**
- ✅ Servicio detecta plantillas
- ✅ Si no existen, las genera automáticamente
- ✅ Prioriza plantillas automáticas
- ✅ Logs informativos del proceso

## 🎯 Resultado Esperado

Después del deployment, deberías ver en los logs:

```
🚀 Aplicación iniciada en 0.0.0.0:8080
✅ Inicialización de plantillas completada
🔍 Inicializando detección automática de plantillas...
✅ Detección completada: 3 plantillas encontradas
📋 Plantillas detectadas:
   📦 Productos (1):
      - plantilla-productos-auto.xlsx
   🏢 Proveedores (1):
      - plantilla-proveedores-auto.xlsx
   📊 Movimientos (1):
      - plantilla-movimientos-auto.xlsx
```

## 🚀 Comando Final de Deployment

```bash
# Desde el directorio iam-backend
fly deploy --remote-only

# Verificar logs
fly logs --follow
```

**¡El deployment debería funcionar correctamente con las plantillas automáticas!** 🎉

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs:** `fly logs --follow`
2. **Conectar al contenedor:** `fly ssh console`
3. **Verificar plantillas:** `ls -la uploads/plantillas/`
4. **Regenerar manualmente:** `node scripts/generate-plantillas-auto.js` 