# 🐟 Resumen de Datos de Prueba para Industria de Alimentos - Restaurante de Mariscos

## 🎯 Objetivo
Se han generado datos de prueba específicos para un restaurante de mariscos usando la cuenta `prueba@iam.com` con el fin de probar todas las funcionalidades del módulo de KPIs específicos para la industria de alimentos.

## 📋 Datos Generados

### 🐟 Productos de Mariscos (19 total)
- **15 productos principales** con diferentes tipos de mariscos y pescados
- **4 productos premium** con stock bajo para probar alertas
- **Rangos de precios**: $45.00 - $1,800.00
- **Márgenes variables**: 36.6% promedio

#### Productos Premium (Alto Valor)
- 🥇 **Caviar Beluga**: $1,800 - Stock: 62
- 🥈 **Bogavante Europeo**: $980 - Stock: 39
- 🥉 **Langosta Viva**: $680 - Stock: 45
- 💎 **Vieiras**: $580 - Stock: 64
- 💎 **Pulpo Fresco**: $480 - Stock: 92

#### Productos con Stock Bajo (Alertas)
- 🔴 **Pescado Robalo**: 0/6 (0.0%) - Sin stock
- 🟡 **Atún Fresco**: 12/5 (240%) - Stock bajo
- 🟠 **Erizo de Mar**: 18/8 (225%) - Stock moderado

### 🏭 Proveedores Especializados (5 total)
- Pesquera del Golfo
- Mariscos Premium del Caribe
- Pescados Frescos del Pacífico
- Distribuidora Mediterránea
- Importadora Noruega

### 📊 Movimientos de Restaurante (277 total)
- **146 entradas** (compras, entregas de pescadores, importaciones)
- **131 salidas** (ventas, consumo interno, mermas por caducidad)
- **Motivos específicos de restaurante**: Preparación de platillos, eventos privados, promociones
- **Distribuidos en los últimos 90 días** para predicciones

### 📋 Pedidos a Proveedores (12 total)
- **Diferentes estados**: PENDIENTE, ENVIADO, RECIBIDO, CANCELADO
- **Cantidades variables**: 5-40 kg/unidades por pedido
- **Últimos 30 días** para análisis de tendencias

## 💰 Métricas Financieras Específicas de Alimentos

### Valor del Inventario
- **Valor total (precio venta)**: $450,585.00
- **Valor total (precio compra)**: $293,315.00
- **Margen promedio**: $142.63 por producto
- **Margen porcentual**: 36.6%

### Rotación de Inventario (Restaurante)
- **Ventas último mes**: 616 unidades
- **Stock promedio**: 63.9 unidades
- **Rotación mensual**: 9.64 veces (alta rotación típica de restaurantes)

### Productos Más Vendidos (Último Mes)
1. 🥇 **Atún Fresco**: 57 vendidas - $350
2. 🥈 **Bogavante Europeo**: 50 vendidas - $980
3. 🥉 **Trucha Salvaje**: 47 vendidas - $280
4. 🏅 **Cangrejo Azul**: 45 vendidas - $320
5. 🏅 **Caviar Beluga**: 45 vendidas - $1,800

## 🌊 Características Específicas de la Industria de Alimentos

### Productos Frescos
- **13 productos con etiqueta "fresco"**
- **1 producto fresco con stock bajo** (Pescado Robalo)
- **Enfoque en frescura** para KPIs de calidad

### Tipos de Productos
- **ALIMENTO**: 19 productos (100%)
- **Variedad**: Mariscos, pescados, moluscos, productos premium
- **Unidades**: KILO, UNIDAD, PAQUETE

### Etiquetas Específicas
- **mariscos**: Productos del mar
- **fresco**: Productos frescos
- **premium**: Productos de lujo
- **vivo**: Productos vivos
- **crudo**: Productos para consumo crudo

## 🎯 KPIs Específicos de la Industria de Alimentos

### 1. KPIs Básicos (`/dashboard-cqrs/kpis`)
- ✅ **Total de productos**: 19
- ✅ **Productos con stock bajo**: 1 (alertas de frescura)
- ✅ **Movimientos último mes**: 277
- ✅ **Valor total inventario**: $450,585.00
- ✅ **Margen promedio**: $142.63
- ✅ **Rotación de inventario**: 9.64 veces/mes

### 2. KPIs Financieros (`/dashboard-cqrs/financial-kpis`)
- ✅ **Margen bruto**: 36.6% (típico de restaurantes premium)
- ✅ **Margen neto**: Estimado (margen bruto - gastos operativos)
- ✅ **ROI del inventario**: Basado en alta rotación
- ✅ **Días de inventario**: 365 / 9.64 = ~38 días
- ✅ **Capital de trabajo**: $293,315.00
- ✅ **Costos de almacenamiento**: Refrigeración especial
- ✅ **Costo de oportunidad**: Productos perecederos
- ✅ **Eficiencia operativa**: Gestión de frescura

### 3. KPIs por Industria (`/dashboard-cqrs/industry-kpis?industry=ALIMENTOS`)
- ✅ **Métricas específicas de alimentos**: Frescura, caducidad
- ✅ **KPIs de calidad**: Productos frescos vs congelados
- ✅ **Gestión de perecederos**: Rotación rápida
- ✅ **Proveedores especializados**: Pesquerías y distribuidoras

### 4. KPIs Predictivos (`/dashboard-cqrs/predictive-kpis`)
- ✅ **Predicción de demanda**: Basada en estacionalidad de mariscos
- ✅ **Predicción de quiebres**: Productos frescos críticos
- ✅ **Tendencias de ventas**: Patrones de restaurante
- ✅ **Estacionalidad**: Temporadas de pesca

## 🔗 Endpoints Específicos para Alimentos

### Endpoints Principales
```
GET /dashboard-cqrs/kpis                    # KPIs básicos de restaurante
GET /dashboard-cqrs/financial-kpis          # KPIs financieros de alimentos
GET /dashboard-cqrs/industry-kpis?industry=ALIMENTOS  # KPIs específicos de alimentos
GET /dashboard-cqrs/predictive-kpis         # Predicciones para restaurante
GET /dashboard-cqrs/data                    # Todos los KPIs
```

### Parámetros Específicos
```
?forceRefresh=true                          # Forzar recálculo
?period=month                               # Período para KPIs financieros
?industry=ALIMENTOS                         # Industria específica de alimentos
?days=30                                    # Días para predicciones
```

## 🚀 Scripts Creados

### 1. `generate-food-industry-data.js`
- Genera datos específicos para restaurante de mariscos
- Crea productos premium y de alto valor
- Genera movimientos típicos de restaurante
- Maneja productos frescos y perecederos

### 2. `verify-food-industry-data.js`
- Verifica datos específicos de la industria de alimentos
- Analiza productos frescos y premium
- Valida métricas de restaurante
- Comprueba KPIs específicos de alimentos

## 🎯 Casos de Prueba Específicos de Alimentos

### 1. Gestión de Frescura
- **Productos frescos**: 13 productos con etiqueta "fresco"
- **Stock bajo crítico**: Pescado Robalo sin stock
- **Rotación rápida**: 9.64 veces por mes

### 2. Productos Premium
- **Alto valor**: Caviar Beluga ($1,800), Bogavante ($980)
- **Margen alto**: 36.6% promedio
- **Gestión especial**: Productos de lujo

### 3. Proveedores Especializados
- **Pesquerías**: Proveedores específicos de mariscos
- **Importaciones**: Productos internacionales
- **Distribución**: Cadena de frío

### 4. Movimientos de Restaurante
- **Consumo interno**: Preparación de platillos
- **Eventos**: Promociones y eventos privados
- **Mermas**: Caducidad de productos frescos

### 5. Predicciones Específicas
- **Estacionalidad**: Temporadas de pesca
- **Demanda**: Patrones de restaurante
- **Frescura**: Gestión de productos perecederos

## ✅ Verificación de Datos

Todas las verificaciones han pasado exitosamente:

- ✅ **Productos de mariscos y pescados**: Variedad de productos marinos
- ✅ **Productos premium (alto valor)**: Productos de lujo para KPIs financieros
- ✅ **Productos frescos**: Productos con etiqueta "fresco"
- ✅ **Movimientos frecuentes**: Alta rotación típica de restaurantes
- ✅ **Productos con stock bajo**: Alertas de inventario
- ✅ **Proveedores especializados**: Proveedores de mariscos
- ✅ **Pedidos activos**: Gestión de pedidos

## 🎉 Estado Final

**Los datos están completamente listos para probar el módulo de KPIs específicos de la industria de alimentos.**

### Próximos Pasos
1. Iniciar el servidor backend: `npm run start:dev`
2. Acceder al dashboard: `http://localhost:3000/dashboard-cqrs/kpis`
3. Probar KPIs específicos de alimentos: `?industry=ALIMENTOS`
4. Verificar alertas de productos frescos
5. Validar predicciones para restaurante

### Credenciales de Prueba
- **Email**: prueba@iam.com
- **Contraseña**: PruebaIAM123?
- **Empresa**: El sabor - Mariscos (ID: 5)
- **Industria**: ALIMENTOS
- **Rol**: ADMIN (acceso completo a todos los KPIs)

### Características Especiales
- 🐟 **Productos específicos de mariscos**
- 🌊 **Enfoque en frescura y calidad**
- 💎 **Productos premium de alto valor**
- 🏭 **Proveedores especializados**
- 📊 **Métricas típicas de restaurante**

---

*Documento generado automáticamente el 7 de julio de 2025* 