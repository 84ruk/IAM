#!/usr/bin/env node

/**
 * Script para verificar dependencias entre módulos
 * Ejecutar: node scripts/check-dependencies.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando dependencias entre módulos...\n');

// Verificar dependencias críticas
function checkCriticalDependencies() {
  console.log('📋 Verificando dependencias críticas:');
  
  // Verificar que UsersModule importa NotificationModule
  const usersModulePath = 'src/users/users.module.ts';
  if (fs.existsSync(usersModulePath)) {
    const content = fs.readFileSync(usersModulePath, 'utf8');
    const hasNotificationImport = content.includes('NotificationModule');
    const hasNotificationInImports = content.includes('NotificationModule,');
    
    console.log(`  ${hasNotificationImport && hasNotificationInImports ? '✅' : '❌'} UsersModule importa NotificationModule`);
  }
  
  // Verificar que AuthModule usa forwardRef para UsersModule
  const authModulePath = 'src/auth/auth.module.ts';
  if (fs.existsSync(authModulePath)) {
    const content = fs.readFileSync(authModulePath, 'utf8');
    const hasForwardRef = content.includes('forwardRef(() => UsersModule)');
    
    console.log(`  ${hasForwardRef ? '✅' : '❌'} AuthModule usa forwardRef para UsersModule`);
  }
  
  // Verificar que NotificationModule no importa AuthModule
  const notificationModulePath = 'src/notifications/notification.module.ts';
  if (fs.existsSync(notificationModulePath)) {
    const content = fs.readFileSync(notificationModulePath, 'utf8');
    const hasAuthImport = content.includes('AuthModule');
    
    console.log(`  ${!hasAuthImport ? '✅' : '❌'} NotificationModule NO importa AuthModule (evita dependencia circular)`);
  }
}

// Verificar servicios que usan NotificationService
function checkNotificationServiceUsage() {
  console.log('\n📧 Verificando uso de NotificationService:');
  
  const servicesToCheck = [
    'src/users/users.service.ts',
    'src/auth/auth.service.ts',
    'src/notifications/notification.service.ts'
  ];
  
  servicesToCheck.forEach(servicePath => {
    if (fs.existsSync(servicePath)) {
      const content = fs.readFileSync(servicePath, 'utf8');
      const usesNotificationService = content.includes('NotificationService');
      const serviceName = path.basename(servicePath, '.ts');
      
      if (usesNotificationService) {
        console.log(`  ✅ ${serviceName} usa NotificationService`);
      } else {
        console.log(`  ⚪ ${serviceName} no usa NotificationService`);
      }
    }
  });
}

// Verificar configuración de logs
function checkLogConfiguration() {
  console.log('\n📝 Verificando configuración de logs:');
  
  // Verificar main.ts
  const mainTsPath = 'src/main.ts';
  if (fs.existsSync(mainTsPath)) {
    const content = fs.readFileSync(mainTsPath, 'utf8');
    const hasConditionalLogs = content.includes("['error', 'warn']");
    const hasDebugCondition = content.includes('process.env.NODE_ENV === \'development\'');
    
    console.log(`  ${hasConditionalLogs ? '✅' : '❌'} Logs condicionales en main.ts`);
    console.log(`  ${hasDebugCondition ? '✅' : '❌'} Debug condicional en CORS`);
  }
  
  // Verificar PrismaService
  const prismaServicePath = 'src/prisma/prisma.service.ts';
  if (fs.existsSync(prismaServicePath)) {
    const content = fs.readFileSync(prismaServicePath, 'utf8');
    const hasConditionalDebug = content.includes('process.env.NODE_ENV === \'development\'');
    const hasOptimizedInterval = content.includes('60000 : 30000');
    
    console.log(`  ${hasConditionalDebug ? '✅' : '❌'} Debug condicional en PrismaService`);
    console.log(`  ${hasOptimizedInterval ? '✅' : '❌'} Intervalo optimizado en PrismaService`);
  }
}

// Verificar estructura de módulos
function checkModuleStructure() {
  console.log('\n🏗️ Verificando estructura de módulos:');
  
  const modules = [
    'src/app.module.ts',
    'src/auth/auth.module.ts',
    'src/users/users.module.ts',
    'src/notifications/notification.module.ts',
    'src/prisma/prisma.module.ts'
  ];
  
  modules.forEach(modulePath => {
    if (fs.existsSync(modulePath)) {
      const content = fs.readFileSync(modulePath, 'utf8');
      const hasValidDecorator = content.includes('@Module({');
      const hasImports = content.includes('imports:');
      const hasProviders = content.includes('providers:');
      const hasExports = content.includes('exports:');
      
      const moduleName = path.basename(modulePath, '.ts');
      console.log(`  ${hasValidDecorator ? '✅' : '❌'} ${moduleName} tiene decorador @Module`);
      console.log(`  ${hasImports ? '✅' : '❌'} ${moduleName} tiene imports`);
      console.log(`  ${hasProviders ? '✅' : '❌'} ${moduleName} tiene providers`);
      console.log(`  ${hasExports ? '✅' : '❌'} ${moduleName} tiene exports`);
    }
  });
}

// Función principal
function main() {
  checkCriticalDependencies();
  checkNotificationServiceUsage();
  checkLogConfiguration();
  checkModuleStructure();
  
  console.log('\n🎯 Verificación de dependencias completada');
  console.log('💡 Si hay errores, revisa las importaciones entre módulos');
  console.log('💡 Asegúrate de que no hay dependencias circulares');
}

main(); 