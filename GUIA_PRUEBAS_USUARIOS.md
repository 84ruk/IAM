# 🧪 Guía de Pruebas para Usuarios No Técnicos

## 📋 Información General
- **Aplicación**: Sistema de Inventario IAM
- **URL de Producción**: https://app.iaminventario.com.mx
- **Tiempo estimado de pruebas**: 15-20 minutos

---

## 🚀 Flujo de Pruebas Recomendado

### 1️⃣ **Registro de Usuario Nuevo**
**Objetivo**: Probar el proceso completo de registro y configuración inicial

#### Pasos:
1. **Abrir la aplicación**
   - Ve a: https://app.iaminventario.com.mx
   - Deberías ver la página de login

2. **Registrar un usuario nuevo**
   - Haz clic en "Registrarse" o "Crear cuenta"
   - Completa el formulario con:
     - **Nombre**: Tu nombre completo
     - **Email**: Un email válido (ej: tuemail@ejemplo.com)
     - **Contraseña**: Una contraseña segura (ej: Test123!)
   - Haz clic en "Registrar"

3. **Configurar la empresa**
   - Después del registro, serás redirigido a configurar tu empresa
   - Completa:
     - **Nombre de la empresa**: Nombre de tu empresa
     - **Tipo de industria**: Selecciona la que más se ajuste
     - **RFC** (opcional): Puedes dejarlo vacío para la prueba
     - **Dirección** (opcional): Dirección de la empresa
   - Haz clic en "Guardar"

#### ✅ **Resultado esperado**:
- Deberías ser redirigido al dashboard principal
- Verás un mensaje de "Empresa configurada exitosamente"

---

### 2️⃣ **Login con Usuario Existente**
**Objetivo**: Probar el acceso con credenciales ya registradas

#### Pasos:
1. **Cerrar sesión** (si estás logueado)
   - Haz clic en tu nombre en la esquina superior derecha
   - Selecciona "Cerrar sesión"

2. **Iniciar sesión**
   - En la página de login, ingresa:
     - **Email**: El email que usaste en el registro
     - **Contraseña**: La contraseña que creaste
   - Haz clic en "Iniciar sesión"

#### ✅ **Resultado esperado**:
- Deberías acceder directamente al dashboard
- No deberías ver la pantalla de configuración de empresa

---

### 3️⃣ **Gestión de Productos**
**Objetivo**: Probar la funcionalidad principal del inventario

#### Pasos:
1. **Ver productos existentes**
   - En el dashboard, haz clic en "Productos"
   - Deberías ver una lista (probablemente vacía al inicio)

2. **Agregar un producto nuevo**
   - Haz clic en "Nuevo Producto" o el botón "+"
   - Completa el formulario:
     - **Nombre**: "Producto de Prueba"
     - **Descripción**: "Descripción del producto de prueba"
     - **Precio**: 100.00
     - **Stock inicial**: 50
     - **Código de barras**: 1234567890123
     - **Proveedor**: Selecciona "Sin proveedor" por ahora
   - Haz clic en "Guardar"

3. **Editar el producto**
   - En la lista de productos, haz clic en el producto que creaste
   - Haz clic en "Editar"
   - Cambia el precio a 150.00
   - Haz clic en "Guardar"

4. **Ver detalles del producto**
   - Haz clic en el producto en la lista
   - Deberías ver toda la información del producto

#### ✅ **Resultado esperado**:
- El producto se crea correctamente
- Se puede editar sin problemas
- Los cambios se reflejan inmediatamente

---

### 4️⃣ **Gestión de Proveedores**
**Objetivo**: Probar la gestión de proveedores

#### Pasos:
1. **Ver proveedores**
   - En el menú lateral, haz clic en "Proveedores"
   - Deberías ver una lista (probablemente vacía)

2. **Agregar un proveedor**
   - Haz clic en "Nuevo Proveedor"
   - Completa:
     - **Nombre**: "Proveedor de Prueba"
     - **Email**: proveedor@ejemplo.com
     - **Teléfono**: 555-123-4567
     - **Dirección**: "Dirección del proveedor"
   - Haz clic en "Guardar"

3. **Asignar proveedor a producto**
   - Ve de vuelta a "Productos"
   - Edita el producto que creaste
   - En "Proveedor", selecciona "Proveedor de Prueba"
   - Guarda los cambios

#### ✅ **Resultado esperado**:
- El proveedor se crea correctamente
- Se puede asignar al producto
- La relación se mantiene

---

### 5️⃣ **Movimientos de Inventario**
**Objetivo**: Probar el control de entrada y salida de productos

#### Pasos:
1. **Ver movimientos**
   - En el menú lateral, haz clic en "Movimientos"
   - Deberías ver una lista de movimientos

2. **Crear movimiento de entrada**
   - Haz clic en "Nuevo Movimiento"
   - Selecciona:
     - **Tipo**: "Entrada"
     - **Producto**: "Producto de Prueba"
     - **Cantidad**: 25
     - **Motivo**: "Compra inicial"
   - Haz clic en "Guardar"

3. **Crear movimiento de salida**
   - Haz clic en "Nuevo Movimiento"
   - Selecciona:
     - **Tipo**: "Salida"
     - **Producto**: "Producto de Prueba"
     - **Cantidad**: 10
     - **Motivo**: "Venta"
   - Haz clic en "Guardar"

4. **Verificar stock**
   - Ve a "Productos"
   - El stock del producto debería ser 65 (50 inicial + 25 entrada - 10 salida)

#### ✅ **Resultado esperado**:
- Los movimientos se registran correctamente
- El stock se actualiza automáticamente
- Se puede ver el historial de movimientos

---

### 6️⃣ **Funcionalidades Adicionales**
**Objetivo**: Probar características avanzadas

#### Pasos:
1. **Buscar productos**
   - En la página de productos, usa el campo de búsqueda
   - Busca "Producto de Prueba"
   - Debería aparecer en los resultados

2. **Filtrar productos**
   - Usa los filtros disponibles (estado, proveedor, etc.)
   - Verifica que los filtros funcionen correctamente

3. **Ver análisis**
   - En el dashboard, revisa las gráficas y estadísticas
   - Deberías ver información sobre productos, movimientos, etc.

---

## 🐛 **Qué hacer si algo no funciona**

### **Problema**: No puedo acceder a la aplicación
**Solución**:
- Verifica que la URL sea correcta: https://app.iaminventario.com.mx
- Intenta con otro navegador (Chrome, Firefox, Safari)
- Limpia el caché del navegador

### **Problema**: Error al registrarse
**Solución**:
- Verifica que el email no esté ya registrado
- Asegúrate de que la contraseña tenga al menos 8 caracteres
- Incluye mayúsculas, minúsculas, números y caracteres especiales

### **Problema**: No puedo iniciar sesión
**Solución**:
- Verifica que el email y contraseña sean correctos
- Si olvidaste la contraseña, contacta al administrador
- Intenta registrarte con un email diferente

### **Problema**: La página se ve mal
**Solución**:
- Actualiza la página (F5)
- Intenta con otro navegador
- Verifica que tengas una conexión a internet estable

---

## 📞 **Contacto para Soporte**

Si encuentras algún problema que no se resuelva con las soluciones anteriores:

- **Email**: [Tu email de contacto]
- **WhatsApp**: [Tu número]
- **Horario de atención**: [Horarios disponibles]

---

## 📊 **Checklist de Pruebas**

Marca ✅ cuando completes cada prueba:

### Registro y Login
- [ ] Registro de usuario nuevo
- [ ] Configuración de empresa
- [ ] Login con usuario existente
- [ ] Cerrar sesión

### Productos
- [ ] Ver lista de productos
- [ ] Crear producto nuevo
- [ ] Editar producto
- [ ] Ver detalles de producto
- [ ] Buscar productos

### Proveedores
- [ ] Ver lista de proveedores
- [ ] Crear proveedor nuevo
- [ ] Asignar proveedor a producto

### Movimientos
- [ ] Ver movimientos
- [ ] Crear movimiento de entrada
- [ ] Crear movimiento de salida
- [ ] Verificar actualización de stock

### Funcionalidades Generales
- [ ] Navegación entre páginas
- [ ] Filtros funcionando
- [ ] Dashboard con estadísticas
- [ ] Responsive en móvil (opcional)

---

## 🎯 **Objetivos de las Pruebas**

Al completar estas pruebas, deberías poder confirmar que:

1. ✅ **El registro funciona correctamente**
2. ✅ **El login es seguro y funcional**
3. ✅ **Se pueden gestionar productos**
4. ✅ **Se pueden gestionar proveedores**
5. ✅ **Los movimientos de inventario funcionan**
6. ✅ **La interfaz es intuitiva y fácil de usar**
7. ✅ **La aplicación es estable y confiable**

---

**¡Gracias por probar la aplicación! Tu feedback es muy valioso para mejorar el sistema.** 🚀 