#!/usr/bin/env node

/**
 * Script para detectar dependencias circulares reales entre módulos
 * Ejecutar: node scripts/check-circular-dependencies.js
 */

const fs = require('fs');

console.log('🔍 Detectando dependencias circulares reales entre módulos...\n');

// Mapeo de módulos y sus dependencias reales
const moduleDependencies = {};

// Función para extraer importaciones de módulos específicos
function extractModuleImports(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Buscar importaciones específicas de módulos
  const moduleImportRegex = /import\s+.*?from\s+['"]([^'"]*?\.module)['"]/g;
  let match;
  
  while ((match = moduleImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Extraer el nombre del módulo
    const moduleName = importPath.split('/').pop().replace('.module', '');
    if (moduleName && !imports.includes(moduleName)) {
      imports.push(moduleName);
    }
  }
  
  // Buscar importaciones de módulos específicos
  const specificModules = [
    'AuthModule',
    'UsersModule', 
    'NotificationModule',
    'PrismaModule',
    'CommonModule',
    'DashboardModule',
    'AdminModule',
    'SuperAdminModule',
    'EmpresaModule',
    'ProductoModule',
    'ProveedorModule',
    'MovimientoModule',
    'PedidoModule',
    'InventarioModule',
    'SensoresModule'
  ];
  
  specificModules.forEach(moduleName => {
    if (content.includes(moduleName) && !imports.includes(moduleName.replace('Module', '').toLowerCase())) {
      imports.push(moduleName.replace('Module', '').toLowerCase());
    }
  });
  
  return imports;
}

// Función para analizar dependencias circulares
function analyzeCircularDependencies() {
  const modules = [
    { path: 'src/auth/auth.module.ts', name: 'auth' },
    { path: 'src/users/users.module.ts', name: 'users' },
    { path: 'src/notifications/notification.module.ts', name: 'notifications' },
    { path: 'src/dashboard/dashboard.module.ts', name: 'dashboard' },
    { path: 'src/admin/admin.module.ts', name: 'admin' },
    { path: 'src/super-admin/super-admin.module.ts', name: 'super-admin' },
    { path: 'src/empresa/empresa.module.ts', name: 'empresa' },
    { path: 'src/producto/producto.module.ts', name: 'producto' },
    { path: 'src/proveedor/proveedor.module.ts', name: 'proveedor' },
    { path: 'src/movimiento/movimiento.module.ts', name: 'movimiento' },
    { path: 'src/pedido/pedido.module.ts', name: 'pedido' },
    { path: 'src/inventario/inventario.module.ts', name: 'inventario' },
    { path: 'src/sensores/sensores.module.ts', name: 'sensores' },
  ];
  
  // Extraer dependencias de cada módulo
  modules.forEach(({ path, name }) => {
    if (fs.existsSync(path)) {
      const imports = extractModuleImports(path);
      moduleDependencies[name] = imports;
      console.log(`📦 ${name}: ${imports.length > 0 ? imports.join(', ') : 'sin dependencias'}`);
    }
  });
  
  console.log('\n🔄 Analizando dependencias circulares...\n');
  
  // Detectar ciclos
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];
  
  function dfs(moduleName, path = []) {
    if (recursionStack.has(moduleName)) {
      const cycle = [...path.slice(path.indexOf(moduleName)), moduleName];
      cycles.push(cycle);
      return;
    }
    
    if (visited.has(moduleName)) {
      return;
    }
    
    visited.add(moduleName);
    recursionStack.add(moduleName);
    
    const dependencies = moduleDependencies[moduleName] || [];
    for (const dep of dependencies) {
      if (moduleDependencies[dep]) {
        dfs(dep, [...path, moduleName]);
      }
    }
    
    recursionStack.delete(moduleName);
  }
  
  // Ejecutar DFS para cada módulo
  for (const moduleName of Object.keys(moduleDependencies)) {
    if (!visited.has(moduleName)) {
      dfs(moduleName);
    }
  }
  
  if (cycles.length > 0) {
    console.log('❌ Dependencias circulares detectadas:');
    cycles.forEach((cycle, index) => {
      console.log(`  ${index + 1}. ${cycle.join(' → ')}`);
    });
    
    console.log('\n💡 Soluciones recomendadas:');
    cycles.forEach((cycle, index) => {
      console.log(`  ${index + 1}. Para el ciclo ${cycle.join(' → ')}:`);
      console.log(`     - Usar forwardRef() en uno de los módulos`);
      console.log(`     - Reestructurar las dependencias`);
      console.log(`     - Crear un módulo intermedio`);
    });
  } else {
    console.log('✅ No se detectaron dependencias circulares');
  }
  
  // Verificar forwardRef
  console.log('\n🔍 Verificando uso de forwardRef...\n');
  
  modules.forEach(({ path, name }) => {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      const hasForwardRef = content.includes('forwardRef(');
      const forwardRefModules = content.match(/forwardRef\(\(\)\s*=>\s*(\w+)\)/g);
      
      if (hasForwardRef) {
        console.log(`✅ ${name}: Usa forwardRef`);
        if (forwardRefModules) {
          forwardRefModules.forEach(ref => {
            console.log(`   - ${ref}`);
          });
        }
      } else {
        console.log(`⚪ ${name}: No usa forwardRef`);
      }
    }
  });
  
  console.log('\n📊 Resumen:');
  console.log(`- Total de módulos analizados: ${modules.length}`);
  console.log(`- Dependencias circulares: ${cycles.length}`);
  console.log(`- Módulos con forwardRef: ${modules.filter(m => {
    if (fs.existsSync(m.path)) {
      return fs.readFileSync(m.path, 'utf8').includes('forwardRef(');
    }
    return false;
  }).length}`);
}

analyzeCircularDependencies(); 