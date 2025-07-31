#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['tsx', 'ts'];

// Patrones para identificar componentes que cargan datos
const LOADING_PATTERNS = [
  {
    name: 'useSWR hook',
    pattern: /const\s*{\s*data,\s*isLoading[^}]*}\s*=\s*useSWR/g,
    addSkeleton: true
  },
  {
    name: 'useState loading',
    pattern: /const\s*\[.*loading.*\]\s*=\s*useState/g,
    addSkeleton: true
  },
  {
    name: 'fetch with loading',
    pattern: /const\s*\[.*isLoading.*\]\s*=\s*useState.*true/g,
    addSkeleton: true
  }
];

// Patrones para agregar Skeleton components
const SKELETON_PATTERNS = [
  {
    name: 'conditional rendering with data',
    pattern: /{(\s*)([^}]*)\s*\?\s*([^:]*)\s*:\s*([^}]*)}/g,
    replace: (match, space, condition, trueContent, falseContent) => {
      // Si el contenido falso es un Skeleton, no hacer nada
      if (falseContent.includes('Skeleton')) {
        return match;
      }
      
      // Si el contenido verdadero parece ser datos, agregar Skeleton
      if (trueContent.includes('data') || trueContent.includes('length')) {
        return `{${space}${condition} ? ${trueContent} : <Skeleton className="h-4 w-full" />}`;
      }
      
      return match;
    }
  }
];

// Función para agregar import de Skeleton si no existe
function addSkeletonImport(content) {
  const hasSkeletonImport = /import.*Skeleton.*from.*['"]@\/components\/ui\/Skeleton['"]/g.test(content);
  
  if (!hasSkeletonImport) {
    // Buscar la última línea de import
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
    
    if (lastImportIndex !== -1) {
      const beforeImports = content.substring(0, lastImportIndex + importLines[importLines.length - 1].length);
      const afterImports = content.substring(lastImportIndex + importLines[importLines.length - 1].length);
      
      return beforeImports + '\nimport Skeleton from \'@/components/ui/Skeleton\'' + afterImports;
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
    
    // Verificar si el archivo contiene patrones de loading
    const hasLoadingPatterns = LOADING_PATTERNS.some(pattern => 
      pattern.pattern.test(content)
    );
    
    if (!hasLoadingPatterns) {
      return false;
    }
    
    // Agregar import de Skeleton si es necesario
    newContent = addSkeletonImport(newContent);
    
    // Aplicar patrones de Skeleton
    SKELETON_PATTERNS.forEach(pattern => {
      const matches = [...newContent.matchAll(pattern.pattern)];
      matches.forEach(match => {
        const replaced = pattern.replace(match[0], match[1], match[2], match[3], match[4]);
        if (replaced !== match[0]) {
          newContent = newContent.replace(match[0], replaced);
          modified = true;
          console.log(`✅ Agregado Skeleton para ${pattern.name} en ${path.relative(SRC_DIR, filePath)}`);
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
  console.log('🔍 Agregando loading states a componentes...\n');
  
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
    console.log('\n✅ Loading states agregados exitosamente!');
    console.log('\n💡 Recomendaciones:');
    console.log('  1. Revisa los cambios realizados');
    console.log('  2. Verifica que los Skeleton components se muestren correctamente');
    console.log('  3. Ajusta los estilos de Skeleton según sea necesario');
  } else {
    console.log('\nℹ️  No se encontraron componentes que necesiten loading states.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { processFile, LOADING_PATTERNS }; 