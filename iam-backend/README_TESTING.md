# 🧪 Testing Dashboard CQRS - Guía Completa

## 📋 **Resumen**

Esta guía proporciona instrucciones completas para ejecutar todos los tests del módulo Dashboard CQRS, incluyendo tests unitarios, de integración, performance, cache y stress.

## 🚀 **Inicio Rápido**

### **Ejecutar Todos los Tests**
```bash
# Desde el directorio raíz del proyecto
cd iam-backend

# Ejecutar suite completa de tests
npm run test:dashboard-cqrs
```

### **Ejecutar Tests Específicos**
```bash
# Tests unitarios únicamente
npm run test:dashboard-unit

# Tests de integración únicamente
npm run test:dashboard-e2e

# Tests de performance únicamente
npm run test:dashboard-performance

# Tests de cache únicamente
npm run test:dashboard-cache

# Tests de stress únicamente
npm run test:dashboard-stress
```

## 📁 **Estructura de Tests**

```
iam-backend/
├── src/dashboard/
│   ├── handlers/
│   │   ├── get-kpis.handler.spec.ts          # Tests unitarios del handler básico
│   │   ├── get-financial-kpis.handler.spec.ts # Tests unitarios del handler financiero
│   │   ├── get-industry-kpis.handler.spec.ts # Tests unitarios del handler de industria
│   │   └── get-predictive-kpis.handler.spec.ts # Tests unitarios del handler predictivo
│   ├── dashboard-cqrs.service.spec.ts        # Tests unitarios del servicio principal
│   └── dashboard-cqrs.controller.spec.ts     # Tests unitarios del controlador
├── test/
│   └── dashboard-cqrs.e2e-spec.ts            # Tests end-to-end
├── scripts/
│   ├── test-dashboard-cqrs.sh                # Script principal de testing
│   ├── performance-test.js                   # Tests de performance
│   ├── cache-test.js                         # Tests de cache
│   └── stress-test.js                        # Tests de stress
└── reports/
    └── dashboard-cqrs-test-report.html       # Reporte HTML generado
```

## 🧪 **Tipos de Tests**

### **1. Tests Unitarios**

Los tests unitarios verifican la funcionalidad individual de cada componente:

#### **GetKpisHandler Tests**
```bash
npm test -- --testPathPattern="get-kpis.handler.spec.ts"
```

**Cubre:**
- ✅ Cache functionality (hit/miss)
- ✅ Database queries
- ✅ Error handling
- ✅ Force refresh
- ✅ Edge cases (null values, zero data)

#### **DashboardCQRSService Tests**
```bash
npm test -- --testPathPattern="dashboard-cqrs.service.spec.ts"
```

**Cubre:**
- ✅ Service orchestration
- ✅ Handler delegation
- ✅ Parameter passing
- ✅ Error propagation
- ✅ Cache management

### **2. Tests de Integración (E2E)**

Los tests end-to-end verifican el flujo completo desde HTTP hasta base de datos:

```bash
npm run test:e2e -- --testPathPattern="dashboard-cqrs.e2e-spec.ts"
```

**Cubre:**
- ✅ HTTP endpoints
- ✅ Authentication & authorization
- ✅ Database integration
- ✅ Response formats
- ✅ Error scenarios
- ✅ Concurrent requests

### **3. Tests de Performance**

Los tests de performance verifican tiempos de respuesta y throughput:

```bash
npm run test:dashboard-performance
```

**Métricas:**
- ⏱️ **Tiempo de respuesta promedio**: < 200ms para KPIs básicos
- 📊 **Throughput**: > 100 requests/segundo
- 🎯 **Percentiles**: P95 < 500ms, P99 < 1000ms
- 🔄 **Concurrencia**: 20 requests simultáneos

### **4. Tests de Cache**

Los tests de cache verifican la funcionalidad de Redis:

```bash
npm run test:dashboard-cache
```

**Verifica:**
- ✅ Cache hit/miss behavior
- ✅ TTL configuration
- ✅ Force refresh functionality
- ✅ Cache invalidation
- ✅ Performance improvement

### **5. Tests de Stress**

Los tests de stress verifican el comportamiento bajo carga:

```bash
npm run test:dashboard-stress
```

**Configuración:**
- 🔥 **100 requests totales**
- ⚡ **20 requests concurrentes**
- ⏱️ **Timeout: 5 segundos**
- 📊 **Success rate: > 95%**

## ⚙️ **Configuración**

### **Variables de Entorno**

```bash
# Configuración de la API
export API_URL="http://localhost:3000"
export TEST_TOKEN="your-jwt-token-here"

# Configuración de tests de performance
export REQUESTS_PER_ENDPOINT=20
export CONCURRENT_REQUESTS=5
export TIMEOUT=5000

# Configuración de base de datos
export DATABASE_URL="postgresql://user:password@localhost:5432/iam_db"
export REDIS_URL="redis://localhost:6379"
```

### **Dependencias Requeridas**

```bash
# Instalar dependencias de testing
npm install --save-dev @nestjs/testing supertest axios

# Verificar que Redis esté corriendo
redis-cli ping

# Verificar que PostgreSQL esté corriendo
psql -h localhost -U postgres -d iam_db -c "SELECT 1;"
```

## 📊 **Métricas de Éxito**

### **Performance Targets**
| Endpoint | Tiempo Esperado | Throughput Mínimo |
|----------|----------------|-------------------|
| `/kpis` | < 200ms | 50 req/s |
| `/financial-kpis` | < 300ms | 30 req/s |
| `/industry-kpis` | < 400ms | 25 req/s |
| `/predictive-kpis` | < 500ms | 20 req/s |
| `/data` | < 800ms | 10 req/s |

### **Reliability Targets**
- ✅ **Success Rate**: > 99%
- ✅ **Error Rate**: < 1%
- ✅ **Cache Hit Rate**: > 80%
- ✅ **Uptime**: > 99.9%

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **1. Tests Fallan por Conexión a Base de Datos**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U postgres -d iam_db

# Ejecutar migraciones
npx prisma migrate deploy
```

#### **2. Tests Fallan por Conexión a Redis**
```bash
# Verificar que Redis esté corriendo
redis-cli ping

# Reiniciar Redis si es necesario
sudo systemctl restart redis
```

#### **3. Tests de Performance Fallan**
```bash
# Verificar que la API esté corriendo
curl http://localhost:3000/health

# Verificar autenticación
curl -H "Authorization: Bearer $TEST_TOKEN" http://localhost:3000/dashboard-cqrs/kpis
```

#### **4. Tests E2E Fallan**
```bash
# Limpiar base de datos de test
npx prisma migrate reset --force

# Ejecutar seeds
npx prisma db seed

# Verificar configuración de test
cat test/jest-e2e.json
```

### **Logs de Debug**

```bash
# Ejecutar tests con logs detallados
npm test -- --verbose --testPathPattern="dashboard"

# Ejecutar tests con coverage
npm test -- --coverage --testPathPattern="dashboard"

# Ejecutar tests en modo watch
npm test -- --watch --testPathPattern="dashboard"
```

## 📈 **Reportes**

### **Reporte HTML Automático**

Después de ejecutar `npm run test:dashboard-cqrs`, se genera automáticamente un reporte HTML en:

```
reports/dashboard-cqrs-test-report.html
```

**Contiene:**
- 📊 Resumen de todos los tests
- 📈 Métricas de performance
- 🎯 Análisis de endpoints
- 💡 Recomendaciones
- 📋 Comparación antes/después

### **Reporte de Coverage**

```bash
# Generar reporte de coverage
npm test -- --coverage --testPathPattern="dashboard"

# Ver reporte en navegador
open coverage/lcov-report/index.html
```

## 🚀 **CI/CD Integration**

### **GitHub Actions**

```yaml
name: Dashboard CQRS Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:dashboard-cqrs
```

### **Docker**

```dockerfile
# Dockerfile para testing
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 📚 **Referencias**

### **Documentación Adicional**
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### **Comandos Útiles**

```bash
# Ver todos los tests disponibles
npm run

# Ejecutar tests con diferentes configuraciones
npm test -- --testPathPattern="dashboard" --verbose
npm test -- --testPathPattern="dashboard" --coverage
npm test -- --testPathPattern="dashboard" --watch

# Limpiar cache de Jest
npm test -- --clearCache

# Ejecutar tests específicos por nombre
npm test -- --testNamePattern="should return basic KPIs"
```

## 🎉 **Conclusión**

El sistema de testing del Dashboard CQRS proporciona cobertura completa para garantizar la calidad, performance y confiabilidad del código. Los tests están diseñados para ser:

- ✅ **Automáticos**: Se ejecutan sin intervención manual
- ✅ **Reproducibles**: Mismos resultados en diferentes entornos
- ✅ **Completos**: Cubren todos los aspectos críticos
- ✅ **Rápidos**: Se ejecutan en menos de 5 minutos
- ✅ **Informativos**: Proporcionan reportes detallados

**¡El Dashboard CQRS está listo para producción! 🚀** 