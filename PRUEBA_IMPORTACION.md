# Instrucciones para Probar la Funcionalidad de Importación

## Resumen del Error

El error "importarUnified is not defined" ha sido resuelto. Se han implementado las siguientes correcciones:

1. ✅ **Función `importarUnified` agregada** al hook `useImportacion.ts`
2. ✅ **Import de React corregido** en `UnifiedImportModal.tsx`
3. ✅ **Componente de prueba creado** para verificar la funcionalidad

## Cómo Probar

### 1. Iniciar el Frontend
```bash
cd iam-frontend
npm run dev
```

### 2. Acceder al Dashboard
- Ve a `http://localhost:3000/dashboard`
- Inicia sesión con tu cuenta

### 3. Probar la Funcionalidad

#### Opción A: Botón Principal de Importación
- En el dashboard, verás el botón "Importar Datos" (gradiente azul)
- Haz clic en él para abrir el modal unificado
- Selecciona el tipo de importación
- Sube un archivo Excel, Numbers o CSV
- Configura las opciones avanzadas
- Inicia la importación

#### Opción B: Botón de Prueba (Temporal)
- En el dashboard, verás un botón adicional "Probar Importación"
- Este botón abre un modal de prueba más simple
- Úsalo para verificar que la función `importarUnified` funciona correctamente

### 4. Verificar el Funcionamiento

#### En la Consola del Navegador:
- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Console"
- Deberías ver logs como:
  ```
  🔍 Iniciando importación: { tipo: 'productos', archivo: 'archivo.xlsx', opciones: {...} }
  🔍 Importación iniciada correctamente
  ```

#### En la Interfaz:
- El modal debería abrirse correctamente
- La selección de tipo de importación debería funcionar
- El drag & drop de archivos debería funcionar
- La barra de progreso debería aparecer durante la importación

## Componentes Implementados

### 1. UnifiedImportModal.tsx
- Modal unificado para importación
- Selector visual de tipo
- Área de drag & drop
- Opciones avanzadas
- Barra de progreso

### 2. ProgressBar.tsx
- Muestra progreso detallado
- Estados visuales (Pendiente, Procesando, Completado, Error)
- Estadísticas de registros
- Tiempo estimado

### 3. ImportTypeSelector.tsx
- Selector visual de tipo de importación
- Tarjetas interactivas
- Información de características

### 4. ImportOptions.tsx
- Panel de opciones avanzadas
- Configuración de sobrescritura
- Notificaciones por email

### 5. ImportButton.tsx
- Botón unificado con variantes
- Integración automática con el modal

### 6. ProgressIndicator.tsx
- Indicador de progreso reutilizable
- Múltiples tamaños y estados

## Estructura de Archivos

```
iam-frontend/src/
├── components/
│   ├── importacion/
│   │   ├── UnifiedImportModal.tsx ✅
│   │   ├── ProgressBar.tsx ✅
│   │   ├── ImportTypeSelector.tsx ✅
│   │   ├── ImportOptions.tsx ✅
│   │   └── TestImportModal.tsx ✅ (temporal)
│   └── ui/
│       ├── ImportButton.tsx ✅
│       └── ProgressIndicator.tsx ✅
├── hooks/
│   └── useImportacion.ts ✅ (actualizado)
└── app/(dashboard)/dashboard/
    └── DashboardClient.tsx ✅ (actualizado)
```

## Verificación de Errores

### Si el error persiste:

1. **Verificar que el hook esté exportando correctamente:**
   ```typescript
   // En useImportacion.ts, línea ~430
   return {
     ...state,
     importarUnified, // ✅ Debe estar aquí
     // ... otras funciones
   }
   ```

2. **Verificar que el modal esté importando correctamente:**
   ```typescript
   // En UnifiedImportModal.tsx, línea ~70
   const {
     importarUnified, // ✅ Debe estar aquí
     // ... otras propiedades
   } = useImportacion()
   ```

3. **Verificar que React esté importado:**
   ```typescript
   // En UnifiedImportModal.tsx, línea ~3
   import React, { useState, useCallback, useRef } from 'react'
   ```

## Próximos Pasos

1. **Probar la funcionalidad** usando el botón de prueba
2. **Verificar que no hay errores** en la consola
3. **Remover el componente de prueba** una vez confirmado que funciona
4. **Probar con archivos reales** de Excel, Numbers o CSV

## Comandos Útiles

```bash
# Iniciar solo el frontend
cd iam-frontend && npm run dev

# Ver logs en tiempo real
cd iam-frontend && npm run dev 2>&1 | tee frontend.log

# Verificar dependencias
cd iam-frontend && npm list react
```

## Contacto

Si encuentras algún error, verifica:
1. La consola del navegador para errores JavaScript
2. La consola del servidor para errores del backend
3. Los logs de la aplicación para errores de importación 