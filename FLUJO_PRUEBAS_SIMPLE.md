# 🧪 Guía Rápida de Pruebas - Sistema IAM

## 🎯 **¿Qué vamos a probar?**
Un sistema de inventario completo que permite gestionar productos, proveedores y movimientos de stock.

---

## 📱 **Paso 1: Acceder a la aplicación**
**URL**: https://app.iaminventario.com.mx

---

## 🔐 **Paso 2: Registrarse (5 minutos)**

### Datos de prueba sugeridos:
- **Nombre**: Tu nombre
- **Email**: tuemail@ejemplo.com
- **Contraseña**: Test123!

### ¿Qué debería pasar?
✅ Te redirige a configurar tu empresa

---

## 🏢 **Paso 3: Configurar empresa (2 minutos)**

### Datos de prueba:
- **Nombre empresa**: "Mi Empresa de Prueba"
- **Industria**: Cualquiera
- **RFC**: (dejar vacío)
- **Dirección**: (opcional)

### ¿Qué debería pasar?
✅ Te lleva al dashboard principal

---

## 📦 **Paso 4: Crear un producto (3 minutos)**

### Datos de prueba:
- **Nombre**: "Producto de Prueba"
- **Precio**: 100.00
- **Stock**: 50
- **Código**: 1234567890123

### ¿Qué debería pasar?
✅ El producto aparece en la lista

---

## 👥 **Paso 5: Crear un proveedor (2 minutos)**

### Datos de prueba:
- **Nombre**: "Proveedor de Prueba"
- **Email**: proveedor@ejemplo.com
- **Teléfono**: 555-123-4567

### ¿Qué debería pasar?
✅ El proveedor aparece en la lista

---

## 📊 **Paso 6: Hacer movimientos (3 minutos)**

### Movimiento de entrada:
- **Tipo**: Entrada
- **Producto**: Producto de Prueba
- **Cantidad**: 25
- **Motivo**: "Compra inicial"

### Movimiento de salida:
- **Tipo**: Salida
- **Producto**: Producto de Prueba
- **Cantidad**: 10
- **Motivo**: "Venta"

### ¿Qué debería pasar?
✅ El stock cambia de 50 → 75 → 65

---

## 🎉 **¡Listo! Has probado todo el flujo principal**

### ✅ **Funcionalidades verificadas:**
- [x] Registro de usuarios
- [x] Configuración de empresa
- [x] Gestión de productos
- [x] Gestión de proveedores
- [x] Movimientos de inventario
- [x] Cálculo automático de stock

---

## 🆘 **Si algo no funciona:**

### ❌ **No puedo acceder**
- Verifica la URL: https://app.iaminventario.com.mx
- Prueba con Chrome o Firefox

### ❌ **Error al registrarse**
- Usa un email diferente
- La contraseña debe tener: mayúscula + minúscula + número + símbolo

### ❌ **No puedo hacer login**
- Verifica email y contraseña
- Si olvidaste la contraseña, regístrate con otro email

### ❌ **La página se ve mal**
- Actualiza la página (F5)
- Verifica tu conexión a internet

---

## 📞 **¿Necesitas ayuda?**

**Contacto**: [Tu información de contacto]

**Tiempo estimado total**: 15-20 minutos

---

**¡Gracias por probar la aplicación! 🚀** 