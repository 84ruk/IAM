#!/usr/bin/env node

/**
 * Script para probar la gestión de sesiones
 * Uso: node scripts/test-session-management.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

class SessionManagementTester {
  constructor() {
    this.token = null;
    this.refreshToken = null;
  }

  async login() {
    try {
      console.log('🔐 Iniciando sesión...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      this.token = response.data.token;
      this.refreshToken = response.data.refreshToken;

      console.log('✅ Login exitoso');
      return true;
    } catch (error) {
      console.error('❌ Error en login:', error.response?.data || error.message);
      return false;
    }
  }

  async checkSessionLimits() {
    try {
      console.log('\n📊 Verificando límites de sesión...');
      
      const response = await axios.get(`${API_BASE_URL}/sessions/limits`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ Límites de sesión:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error verificando límites:', error.response?.data || error.message);
      return null;
    }
  }

  async getMySessions() {
    try {
      console.log('\n📋 Obteniendo sesiones activas...');
      
      const response = await axios.get(`${API_BASE_URL}/sessions/my-sessions`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log(`✅ Sesiones activas: ${response.data.length}`);
      response.data.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.id.substring(0, 8)}... - ${session.createdAt}`);
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo sesiones:', error.response?.data || error.message);
      return [];
    }
  }

  async getSessionStats() {
    try {
      console.log('\n📈 Obteniendo estadísticas de sesiones...');
      
      const response = await axios.get(`${API_BASE_URL}/sessions/stats`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ Estadísticas de sesiones:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data || error.message);
      return null;
    }
  }

  async revokeAllOtherSessions() {
    try {
      console.log('\n🗑️ Revocando otras sesiones...');
      
      // Extraer JTI del token actual (simulado)
      const currentJti = this.token.split('.')[1];
      const decodedJti = Buffer.from(currentJti, 'base64').toString();
      const jti = JSON.parse(decodedJti).jti;

      const response = await axios.delete(`${API_BASE_URL}/sessions/my-sessions?currentJti=${jti}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: {
          reason: 'test_cleanup',
        },
      });

      console.log('✅ Resultado de revocación:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error revocando sesiones:', error.response?.data || error.message);
      return null;
    }
  }

  async cleanupExpiredSessions() {
    try {
      console.log('\n🧹 Limpiando sesiones expiradas...');
      
      const response = await axios.post(`${API_BASE_URL}/sessions/cleanup`, {}, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ Resultado de limpieza:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en limpieza:', error.response?.data || error.message);
      return null;
    }
  }

  async runTests() {
    console.log('🚀 Iniciando pruebas de gestión de sesiones...\n');

    // Test 1: Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ No se pudo continuar sin login exitoso');
      return;
    }

    // Test 2: Verificar límites
    await this.checkSessionLimits();

    // Test 3: Obtener sesiones
    await this.getMySessions();

    // Test 4: Obtener estadísticas
    await this.getSessionStats();

    // Test 5: Revocar otras sesiones
    await this.revokeAllOtherSessions();

    // Test 6: Limpiar sesiones expiradas
    await this.cleanupExpiredSessions();

    console.log('\n✅ Todas las pruebas completadas');
  }
}

// Ejecutar pruebas
async function main() {
  const tester = new SessionManagementTester();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SessionManagementTester; 