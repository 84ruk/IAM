#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];

// Patrones de imports a optimizar
const OPTIMIZATION_PATTERNS = [
  {
    name: 'lucide-react imports',
    pattern: /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/g,
    optimize: (match, imports) => {
      const iconNames = imports
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (iconNames.length > 5) {
        return `import { \n  ${iconNames.join(',\n  ')}\n} from 'lucide-react'`;
      }
      return match;
    }
  },
  {
    name: 'recharts imports',
    pattern: /import\s*{([^}]+)}\s*from\s*['"]recharts['"]/g,
    optimize: (match, imports) => {
      const componentNames = imports
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      // Verificar si todos los componentes están disponibles en RechartsWrapper
      const availableComponents = [
        'LineChart', 'Line', 'XAxis', 'YAxis', 'Tooltip', 'ResponsiveContainer',
        'PieChart', 'Pie', 'Cell', 'BarChart', 'Bar', 'CartesianGrid',
        'Area', 'AreaChart', 'ComposedChart', 'Legend'
      ];
      
      const allAvailable = componentNames.every(name => 
        availableComponents.includes(name)
      );
      
      if (allAvailable) {
        return `import { ${componentNames.join(', ')} } from '@/components/ui/RechartsWrapper'`;
      }
      
      return match;
    }
  }
];

// Función para procesar un archivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    OPTIMIZATION_PATTERNS.forEach(pattern => {
      const matches = [...newContent.matchAll(pattern.pattern)];
      matches.forEach(match => {
        const optimized = pattern.optimize(match[0], match[1]);
        if (optimized !== match[0]) {
          newContent = newContent.replace(match[0], optimized);
          modified = true;
          console.log(`✅ Optimizado ${pattern.name} en ${path.relative(SRC_DIR, filePath)}`);
        }
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
  console.log('🔍 Iniciando optimización de imports...\n');
  
  let processedFiles = 0;
  let optimizedFiles = 0;
  
  EXTENSIONS.forEach(ext => {
    const pattern = path.join(SRC_DIR, `**/*.${ext}`);
    const files = glob.sync(pattern);
    
    files.forEach(file => {
      processedFiles++;
      if (processFile(file)) {
        optimizedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${processedFiles}`);
  console.log(`   Archivos optimizados: ${optimizedFiles}`);
  console.log(`   Archivos sin cambios: ${processedFiles - optimizedFiles}`);
  
  if (optimizedFiles > 0) {
    console.log('\n✅ Optimización completada exitosamente!');
  } else {
    console.log('\nℹ️  No se encontraron imports que necesiten optimización.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { processFile, OPTIMIZATION_PATTERNS }; 