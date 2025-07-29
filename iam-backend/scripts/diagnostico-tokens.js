#!/usr/bin/env node

/**
 * Script de diagnóstico para tokens JWT
 * Verifica el estado de los tokens y detecta problemas de seguridad
 */

const { PrismaClient } = require('@prisma/client');

class TokenDiagnostico {
  constructor() {
    this.prisma = new PrismaClient();
    this.logs = [];
  }

  async ejecutarDiagnostico() {
    console.log('🔍 Iniciando diagnóstico de tokens JWT...\n');

    try {
      // 1. Verificar conectividad a la base de datos
      await this.verificarConexionBD();

      // 2. Analizar tokens activos
      await this.analizarTokensActivos();

      // 3. Verificar actividad sospechosa
      await this.verificarActividadSospechosa();

      // 4. Analizar blacklist
      await this.analizarBlacklist();

      // 5. Generar recomendaciones
      this.generarRecomendaciones();

    } catch (error) {
      console.error('❌ Error durante el diagnóstico:', error.message);
      this.logs.push(`ERROR: ${error.message}`);
    } finally {
      await this.prisma.$disconnect();
    }

    // Mostrar resumen
    this.mostrarResumen();
  }

  async verificarConexionBD() {
    console.log('📊 Verificando conectividad a la base de datos...');
    
    try {
      const result = await this.prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Conexión a BD exitosa');
      this.logs.push('Conexión a BD: OK');
    } catch (error) {
      console.error('❌ Error de conexión a BD:', error.message);
      this.logs.push(`Conexión a BD: ERROR - ${error.message}`);
      throw error;
    }
  }

  async analizarTokensActivos() {
    console.log('\n🔐 Analizando tokens activos...');
    
    try {
      // Contar tokens activos por usuario
      const tokensPorUsuario = await this.prisma.refreshToken.groupBy({
        by: ['userId'],
        where: {
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      console.log(`   - Total de usuarios con tokens activos: ${tokensPorUsuario.length}`);
      
      if (tokensPorUsuario.length > 0) {
        console.log('   - Top 5 usuarios con más tokens activos:');
        tokensPorUsuario.slice(0, 5).forEach((item, index) => {
          console.log(`     ${index + 1}. Usuario ${item.userId}: ${item._count.id} tokens`);
          
          if (item._count.id > 15) {
            console.log(`       ⚠️  ADVERTENCIA: Muchos tokens activos`);
            this.logs.push(`ADVERTENCIA: Usuario ${item.userId} tiene ${item._count.id} tokens activos`);
          }
        });
      }

      // Contar tokens recientes (últimas 24 horas)
      const tokensRecientes = await this.prisma.refreshToken.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      console.log(`   - Tokens creados en las últimas 24 horas: ${tokensRecientes}`);
      
      if (tokensRecientes > 100) {
        console.log('   ⚠️  ADVERTENCIA: Muchos tokens creados recientemente');
        this.logs.push('ADVERTENCIA: Muchos tokens creados recientemente');
      }

      this.logs.push('Análisis tokens activos: OK');
    } catch (error) {
      console.error('❌ Error analizando tokens:', error.message);
      this.logs.push(`Análisis tokens: ERROR - ${error.message}`);
    }
  }

  async verificarActividadSospechosa() {
    console.log('\n🚨 Verificando actividad sospechosa...');
    
    try {
      // Buscar usuarios con muchos tokens activos
      const usuariosSospechosos = await this.prisma.refreshToken.groupBy({
        by: ['userId'],
        where: {
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gt: 15, // Umbral de tokens activos
            },
          },
        },
      });

      if (usuariosSospechosos.length > 0) {
        console.log(`   - Usuarios con actividad sospechosa: ${usuariosSospechosos.length}`);
        usuariosSospechosos.forEach((item) => {
          console.log(`     • Usuario ${item.userId}: ${item._count.id} tokens activos`);
        });
        this.logs.push(`ADVERTENCIA: ${usuariosSospechosos.length} usuarios con actividad sospechosa`);
      } else {
        console.log('   ✅ No se detectó actividad sospechosa');
      }

      // Verificar tokens expirados no revocados
      const tokensExpirados = await this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (tokensExpirados > 0) {
        console.log(`   ⚠️  Tokens expirados no revocados: ${tokensExpirados}`);
        this.logs.push(`ADVERTENCIA: ${tokensExpirados} tokens expirados no revocados`);
      } else {
        console.log('   ✅ No hay tokens expirados sin revocar');
      }

      this.logs.push('Verificación actividad sospechosa: OK');
    } catch (error) {
      console.error('❌ Error verificando actividad sospechosa:', error.message);
      this.logs.push(`Verificación actividad sospechosa: ERROR - ${error.message}`);
    }
  }

  async analizarBlacklist() {
    console.log('\n🚫 Analizando blacklist...');
    
    try {
      const blacklistStats = await this.prisma.blacklistedToken.groupBy({
        by: ['reason'],
        _count: {
          id: true,
        },
      });

      const totalBlacklisted = blacklistStats.reduce((sum, item) => sum + item._count.id, 0);
      console.log(`   - Total de tokens en blacklist: ${totalBlacklisted}`);

      if (blacklistStats.length > 0) {
        console.log('   - Tokens por razón:');
        blacklistStats.forEach((item) => {
          console.log(`     • ${item.reason}: ${item._count.id} tokens`);
        });
      }

      // Verificar tokens expirados en blacklist
      const blacklistExpirados = await this.prisma.blacklistedToken.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (blacklistExpirados > 0) {
        console.log(`   ⚠️  Tokens expirados en blacklist: ${blacklistExpirados}`);
        this.logs.push(`INFO: ${blacklistExpirados} tokens expirados en blacklist`);
      }

      this.logs.push('Análisis blacklist: OK');
    } catch (error) {
      console.error('❌ Error analizando blacklist:', error.message);
      this.logs.push(`Análisis blacklist: ERROR - ${error.message}`);
    }
  }

  generarRecomendaciones() {
    console.log('\n💡 Recomendaciones:');
    
    const recomendaciones = [
      '✅ Los umbrales de detección de actividad sospechosa han sido ajustados',
      '✅ Sistema de limpieza automática de tokens implementado',
      '✅ Endpoint de limpieza manual disponible en /auth/clear-blacklist',
      '🔧 Considerar implementar rate limiting más estricto en login',
      '🔧 Monitorear regularmente los logs de actividad sospechosa',
      '🔧 Implementar alertas automáticas para usuarios con muchos tokens',
      '📊 Revisar configuración de expiración de tokens',
    ];

    recomendaciones.forEach(rec => {
      console.log(`   ${rec}`);
    });

    this.logs.push('Recomendaciones generadas');
  }

  mostrarResumen() {
    console.log('\n📋 Resumen del diagnóstico:');
    console.log('='.repeat(50));
    
    const errores = this.logs.filter(log => log.includes('ERROR'));
    const advertencias = this.logs.filter(log => log.includes('ADVERTENCIA'));
    const exitos = this.logs.filter(log => log.includes('OK'));

    console.log(`✅ Exitosos: ${exitos.length}`);
    console.log(`⚠️  Advertencias: ${advertencias.length}`);
    console.log(`❌ Errores: ${errores.length}`);

    if (errores.length === 0) {
      console.log('\n🎉 El sistema de tokens está funcionando correctamente');
    } else {
      console.log('\n🔧 Se requieren acciones para resolver problemas');
    }
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  const diagnostico = new TokenDiagnostico();
  diagnostico.ejecutarDiagnostico()
    .then(() => {
      console.log('\n✨ Diagnóstico completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = TokenDiagnostico; 