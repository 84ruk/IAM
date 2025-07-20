#!/usr/bin/env node

/**
 * 👥 SCRIPT PARA VERIFICAR USUARIOS EN LA BASE DE DATOS
 * 
 * Este script verifica qué usuarios existen y sus datos.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

// Colores para console.log
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

async function checkUsers() {
  log('👥 VERIFICANDO USUARIOS EN LA BASE DE DATOS', 'bright');
  log('==========================================', 'bright');
  
  try {
    // 1. Verificar conexión a la base de datos
    logTest('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    logSuccess('Conexión a la base de datos establecida');
    
    // 2. Obtener todos los usuarios
    logTest('2. Obteniendo todos los usuarios...');
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        rol: true,
        empresaId: true,
        nombre: true,
        activo: true,
        createdAt: true,
        authProvider: true,
        googleId: true,
        setupCompletado: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    logInfo(`Total de usuarios encontrados: ${usuarios.length}`);
    
    if (usuarios.length === 0) {
      logWarning('No hay usuarios en la base de datos');
      return;
    }
    
    // 3. Mostrar información de cada usuario
    logTest('3. Información detallada de usuarios:');
    usuarios.forEach((usuario, index) => {
      logInfo(`\n${index + 1}. Usuario ID: ${usuario.id}`);
      logInfo(`   📧 Email: ${usuario.email}`);
      logInfo(`   👤 Nombre: ${usuario.nombre || 'N/A'}`);
      logInfo(`   🏢 Rol: ${usuario.rol}`);
      logInfo(`   🏭 Empresa ID: ${usuario.empresaId || 'Sin empresa'}`);
      logInfo(`   🔐 Tiene password: ${usuario.password ? 'Sí' : 'No'}`);
      logInfo(`   ✅ Activo: ${usuario.activo ? 'Sí' : 'No'}`);
      logInfo(`   📅 Fecha creación: ${usuario.createdAt.toISOString().split('T')[0]}`);
      logInfo(`   🔗 Auth Provider: ${usuario.authProvider}`);
      logInfo(`   🎯 Setup completado: ${usuario.setupCompletado ? 'Sí' : 'No'}`);
      
      // Verificar si es el usuario que buscamos
      if (usuario.email === 'prueba@iam.com') {
        logSuccess('   🎯 ¡Este es el usuario que estamos buscando!');
      }
    });
    
    // 4. Buscar específicamente prueba@iam.com
    logTest('4. Buscando usuario prueba@iam.com específicamente...');
    const usuarioPrueba = usuarios.find(u => u.email === 'prueba@iam.com');
    
    if (usuarioPrueba) {
      logSuccess('Usuario prueba@iam.com encontrado:');
      logInfo(`   ID: ${usuarioPrueba.id}`);
      logInfo(`   Email: ${usuarioPrueba.email}`);
      logInfo(`   Rol: ${usuarioPrueba.rol}`);
      logInfo(`   Empresa ID: ${usuarioPrueba.empresaId}`);
      logInfo(`   Tiene password: ${usuarioPrueba.password ? 'Sí' : 'No'}`);
      logInfo(`   Activo: ${usuarioPrueba.activo ? 'Sí' : 'No'}`);
      
      if (!usuarioPrueba.password) {
        logWarning('❌ El usuario no tiene contraseña configurada');
      }
      
      if (!usuarioPrueba.activo) {
        logWarning('❌ El usuario no está activo');
      }
    } else {
      logError('❌ Usuario prueba@iam.com no encontrado');
    }
    
    // 5. Verificar empresas de los usuarios
    logTest('5. Verificando empresas de los usuarios...');
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        rfc: true
      }
    });
    
    logInfo('Empresas disponibles:');
    empresas.forEach(empresa => {
      logInfo(`   - ID ${empresa.id}: ${empresa.nombre} (${empresa.rfc || 'Sin RFC'})`);
    });
    
    // 6. Mostrar usuarios por empresa
    logTest('6. Usuarios por empresa:');
    const usuariosPorEmpresa = usuarios.reduce((acc, usuario) => {
      const empresaId = usuario.empresaId || 'Sin empresa';
      if (!acc[empresaId]) {
        acc[empresaId] = [];
      }
      acc[empresaId].push(usuario);
      return acc;
    }, {});
    
    Object.entries(usuariosPorEmpresa).forEach(([empresaId, usuariosEmpresa]) => {
      const empresa = empresas.find(e => e.id === parseInt(empresaId));
      const nombreEmpresa = empresa ? empresa.nombre : 'Sin empresa';
      logInfo(`\n   Empresa ${empresaId} (${nombreEmpresa}):`);
      usuariosEmpresa.forEach(usuario => {
        logInfo(`     - ${usuario.email} (${usuario.rol})`);
      });
    });
    
    // 7. Recomendaciones
    log('\n💡 RECOMENDACIONES', 'green');
    log('==================', 'green');
    
    if (!usuarioPrueba) {
      logWarning('1. Crear usuario prueba@iam.com');
    } else if (!usuarioPrueba.password) {
      logWarning('2. Configurar contraseña para prueba@iam.com');
    } else if (!usuarioPrueba.activo) {
      logWarning('3. Activar usuario prueba@iam.com');
    } else {
      logSuccess('4. Usuario prueba@iam.com está configurado correctamente');
    }
    
    logInfo('5. Usar credenciales válidas para hacer login');
    logInfo('6. Verificar que el usuario tenga empresa asignada');
    
  } catch (error) {
    logError(`Error verificando usuarios: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  checkUsers()
    .then(() => {
      log('\n🎯 VERIFICACIÓN COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error en la verificación: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { checkUsers }; 