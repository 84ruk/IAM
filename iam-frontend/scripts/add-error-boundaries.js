#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['tsx', 'ts'];

// Componentes críticos que necesitan Error Boundaries
const CRITICAL_COMPONENTS = [
  'KPICard',
  'DailyMovementsChart',
  'ImportacionProgress',
  'SmartImportModal',
  'LineChart',
  'BarChart',
  'PieChart',
  'AreaChart'
];

// Patrones para identificar componentes críticos
const CRITICAL_PATTERNS = [
  {
    name: 'KPICard',
    pattern: /<KPICard[^>]*>/g,
    wrap: (match) => `<ErrorBoundary>${match}</ErrorBoundary>`
  },
  {
    name: 'DailyMovementsChart',
    pattern: /<DailyMovementsChart[^>]*>/g,
    wrap: (match) => `<ErrorBoundary>${match}</ErrorBoundary>`
  },
  {
    name: 'ImportacionProgress',
    pattern: /<ImportacionProgress[^>]*>/g,
    wrap: (match) => `<ErrorBoundary>${match}</ErrorBoundary>`
  },
  {
    name: 'SmartImportModal',
    pattern: /<SmartImportModal[^>]*>/g,
    wrap: (match) => `<ErrorBoundary>${match}</ErrorBoundary>`
  },
  {
    name: 'Chart components',
    pattern: /<(LineChart|BarChart|PieChart|AreaChart)[^>]*>/g,
    wrap: (match) => `<ErrorBoundary>${match}</ErrorBoundary>`
  }
];

// Función para agregar import de ErrorBoundary si no existe
function addErrorBoundaryImport(content) {
  const hasErrorBoundaryImport = /import.*ErrorBoundary.*from.*['"]@\/components\/ui\/ErrorBoundary['"]/g.test(content);
  
  if (!hasErrorBoundaryImport) {
    // Buscar la última línea de import
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
    
    if (lastImportIndex !== -1) {
      const beforeImports = content.substring(0, lastImportIndex + importLines[importLines.length - 1].length);
      const afterImports = content.substring(lastImportIndex + importLines[importLines.length - 1].length);
      
      return beforeImports + '\nimport ErrorBoundary from \'@/components/ui/ErrorBoundary\'' + afterImports;
    }
  }
  
  return content;
}

// Función para procesar un archivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Verificar si el archivo contiene componentes críticos
    const hasCriticalComponents = CRITICAL_PATTERNS.some(pattern => 
      pattern.pattern.test(content)
    );
    
    if (!hasCriticalComponents) {
      return false;
    }
    
    // Agregar import de ErrorBoundary si es necesario
    newContent = addErrorBoundaryImport(newContent);
    
    // Aplicar patrones de Error Boundaries
    CRITICAL_PATTERNS.forEach(pattern => {
      const matches = [...newContent.matchAll(pattern.pattern)];
      matches.forEach(match => {
        const wrapped = pattern.wrap(match[0]);
        newContent = newContent.replace(match[0], wrapped);
        modified = true;
        console.log(`✅ Agregado ErrorBoundary para ${pattern.name} en ${path.relative(SRC_DIR, filePath)}`);
      });
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función principal
function main() {
  console.log('🔍 Agregando Error Boundaries a componentes críticos...\n');
  
  let processedFiles = 0;
  let modifiedFiles = 0;
  
  EXTENSIONS.forEach(ext => {
    const pattern = path.join(SRC_DIR, `**/*.${ext}`);
    const files = glob.sync(pattern);
    
    files.forEach(file => {
      processedFiles++;
      if (processFile(file)) {
        modifiedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${processedFiles}`);
  console.log(`   Archivos modificados: ${modifiedFiles}`);
  console.log(`   Archivos sin cambios: ${processedFiles - modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n✅ Error Boundaries agregados exitosamente!');
    console.log('\n💡 Recomendaciones:');
    console.log('  1. Revisa los cambios realizados');
    console.log('  2. Verifica que los componentes funcionen correctamente');
    console.log('  3. Prueba la aplicación para asegurar que no hay errores');
  } else {
    console.log('\nℹ️  No se encontraron componentes críticos que necesiten Error Boundaries.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { processFile, CRITICAL_PATTERNS }; 