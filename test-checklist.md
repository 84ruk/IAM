# Checklist de Pruebas Post-Deploy

## 🔐 Autenticación
- [ ] Login con email/password
- [ ] Login con Google OAuth
- [ ] Logout funcional
- [ ] Protección de rutas (sin login no accede)
- [ ] JWT expiración correcta (24 horas)
- [ ] Auditoría JWT funcionando

## 🏢 Configuración de Empresa
- [ ] Tipo de industria se muestra como "Restaurante" (no "Genérica")
- [ ] Información de empresa correcta en dashboard
- [ ] Configuración específica por industria

## 📊 Dashboard Principal
- [ ] Carga sin errores
- [ ] Estadísticas básicas visibles
- [ ] Navegación entre secciones
- [ ] Responsive design (móvil/tablet)

## 🏷️ Gestión de Productos
- [ ] Listar productos
- [ ] Crear nuevo producto
- [ ] Editar producto existente
- [ ] Eliminar producto (soft delete)
- [ ] Ver productos eliminados
- [ ] Filtros y búsqueda
- [ ] Paginación

## 📦 Gestión de Inventario
- [ ] Ver stock actual
- [ ] Crear movimientos de inventario
- [ ] Editar movimientos
- [ ] Eliminar movimientos
- [ ] Ver movimientos eliminados
- [ ] Códigos de barras (si aplica)

## 👥 Gestión de Proveedores
- [ ] Listar proveedores
- [ ] Crear nuevo proveedor
- [ ] Editar proveedor
- [ ] Eliminar proveedor
- [ ] Ver proveedores eliminados

## 📋 Gestión de Pedidos
- [ ] Crear pedidos
- [ ] Ver estado de pedidos
- [ ] Actualizar pedidos

## 🔧 Funcionalidades Técnicas
- [ ] Rate limiting funcionando
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Validaciones de formularios
- [ ] Notificaciones de éxito/error

## 📱 Compatibilidad
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Móvil (iOS/Android)
- [ ] Tablet

## 🔒 Seguridad
- [ ] CORS configurado correctamente
- [ ] Cookies seguras en producción
- [ ] No hay información sensible en logs
- [ ] Validación de roles y permisos 