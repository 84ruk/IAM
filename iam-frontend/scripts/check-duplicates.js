#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];

// Función para calcular hash del contenido de un archivo
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

// Función para obtener todos los archivos
function getAllFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).slice(1);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Función para encontrar duplicados
function findDuplicates(files) {
  const hashMap = new Map();
  const duplicates = [];
  
  files.forEach(file => {
    const hash = getFileHash(file);
    if (hash) {
      if (hashMap.has(hash)) {
        const existingFile = hashMap.get(hash);
        duplicates.push({
          hash,
          files: [existingFile, file]
        });
      } else {
        hashMap.set(hash, file);
      }
    }
  });
  
  return duplicates;
}

// Función para mostrar duplicados
function displayDuplicates(duplicates) {
  if (duplicates.length === 0) {
    console.log('✅ No se encontraron archivos duplicados.');
    return;
  }
  
  console.log(`\n🔍 Se encontraron ${duplicates.length} grupos de archivos duplicados:\n`);
  
  duplicates.forEach((group, index) => {
    console.log(`Grupo ${index + 1}:`);
    group.files.forEach(file => {
      const relativePath = path.relative(SRC_DIR, file);
      console.log(`  📄 ${relativePath}`);
    });
    console.log(`  🔑 Hash: ${group.hash}\n`);
  });
  
  console.log('💡 Recomendaciones:');
  console.log('  1. Revisa cada grupo de duplicados');
  console.log('  2. Determina cuál archivo mantener');
  console.log('  3. Actualiza las importaciones si es necesario');
  console.log('  4. Elimina los archivos duplicados');
}

// Función principal
function main() {
  console.log('🔍 Buscando archivos duplicados...\n');
  
  try {
    const files = getAllFiles(SRC_DIR, EXTENSIONS);
    console.log(`📁 Archivos encontrados: ${files.length}`);
    
    const duplicates = findDuplicates(files);
    displayDuplicates(duplicates);
    
    if (duplicates.length > 0) {
      console.log('\n📊 Resumen:');
      console.log(`   Archivos totales: ${files.length}`);
      console.log(`   Grupos duplicados: ${duplicates.length}`);
      console.log(`   Archivos duplicados: ${duplicates.reduce((acc, group) => acc + group.files.length, 0)}`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la búsqueda:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { findDuplicates, getAllFiles }; 