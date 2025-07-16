#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Analizador de logs para detectar patrones y problemas
 */
class LogAnalyzer {
  constructor() {
    this.patterns = {
      databaseErrors: /Can't reach database server|Server has closed the connection|DbHandler exited/gi,
      securityAlerts: /Suspicious token activity detected|Error de seguridad/gi,
      jwtErrors: /Error checking token blacklist|JwtBlacklistService/gi,
      successfulOperations: /Autenticación exitosa|Movimientos obtenidos/gi,
      connectionStats: /Estadísticas del pool de conexiones/gi
    };
    
    this.stats = {
      totalLines: 0,
      databaseErrors: 0,
      securityAlerts: 0,
      jwtErrors: 0,
      successfulOperations: 0,
      connectionStats: 0,
      errors: [],
      warnings: [],
      info: []
    };
  }

  /**
   * Analiza un archivo de log o texto
   */
  analyze(input) {
    const lines = typeof input === 'string' ? input.split('\n') : input;
    
    this.stats.totalLines = lines.length;
    
    lines.forEach((line, index) => {
      this.analyzeLine(line, index + 1);
    });
    
    return this.generateReport();
  }

  /**
   * Analiza una línea individual
   */
  analyzeLine(line, lineNumber) {
    // Detectar nivel de log
    if (line.includes('ERROR')) {
      this.stats.errors.push({ line, lineNumber });
    } else if (line.includes('WARN')) {
      this.stats.warnings.push({ line, lineNumber });
    } else if (line.includes('LOG') || line.includes('DEBUG')) {
      this.stats.info.push({ line, lineNumber });
    }

    // Contar patrones
    if (this.patterns.databaseErrors.test(line)) {
      this.stats.databaseErrors++;
    }
    if (this.patterns.securityAlerts.test(line)) {
      this.stats.securityAlerts++;
    }
    if (this.patterns.jwtErrors.test(line)) {
      this.stats.jwtErrors++;
    }
    if (this.patterns.successfulOperations.test(line)) {
      this.stats.successfulOperations++;
    }
    if (this.patterns.connectionStats.test(line)) {
      this.stats.connectionStats++;
    }
  }

  /**
   * Genera un reporte detallado
   */
  generateReport() {
    const report = {
      summary: {
        totalLines: this.stats.totalLines,
        errors: this.stats.errors.length,
        warnings: this.stats.warnings.length,
        info: this.stats.info.length
      },
      patterns: {
        databaseErrors: this.stats.databaseErrors,
        securityAlerts: this.stats.securityAlerts,
        jwtErrors: this.stats.jwtErrors,
        successfulOperations: this.stats.successfulOperations,
        connectionStats: this.stats.connectionStats
      },
      recommendations: this.generateRecommendations(),
      topErrors: this.getTopErrors(),
      topWarnings: this.getTopWarnings()
    };

    return report;
  }

  /**
   * Genera recomendaciones basadas en los patrones encontrados
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.stats.databaseErrors > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Errores de conexión a base de datos',
        count: this.stats.databaseErrors,
        solution: 'Configurar base de datos local o verificar conexión a Supabase',
        action: 'Ejecutar: ./setup-local-db.sh'
      });
    }

    if (this.stats.securityAlerts > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Muchas alertas de seguridad',
        count: this.stats.securityAlerts,
        solution: 'Ajustar umbrales de seguridad para desarrollo',
        action: 'Usar configuración de desarrollo'
      });
    }

    if (this.stats.jwtErrors > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Errores en JWT Blacklist Service',
        count: this.stats.jwtErrors,
        solution: 'Implementar manejo robusto de errores de base de datos',
        action: 'Usar DatabaseErrorHandlerService'
      });
    }

    if (this.stats.successfulOperations > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: 'Operaciones exitosas detectadas',
        count: this.stats.successfulOperations,
        solution: 'El sistema está funcionando correctamente',
        action: 'Continuar con el desarrollo'
      });
    }

    return recommendations;
  }

  /**
   * Obtiene los errores más frecuentes
   */
  getTopErrors() {
    const errorCounts = {};
    this.stats.errors.forEach(({ line }) => {
      const key = line.split(']')[1]?.trim() || line;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Obtiene las advertencias más frecuentes
   */
  getTopWarnings() {
    const warningCounts = {};
    this.stats.warnings.forEach(({ line }) => {
      const key = line.split(']')[1]?.trim() || line;
      warningCounts[key] = (warningCounts[key] || 0) + 1;
    });

    return Object.entries(warningCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([warning, count]) => ({ warning, count }));
  }

  /**
   * Imprime el reporte en consola
   */
  printReport(report) {
    console.log('\n🔍 ANÁLISIS DE LOGS - REPORTE\n');
    console.log('=' .repeat(50));
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Total de líneas: ${report.summary.totalLines}`);
    console.log(`   Errores: ${report.summary.errors}`);
    console.log(`   Advertencias: ${report.summary.warnings}`);
    console.log(`   Información: ${report.summary.info}`);
    
    console.log('\n🎯 PATRONES DETECTADOS:');
    console.log(`   Errores de BD: ${report.patterns.databaseErrors}`);
    console.log(`   Alertas de seguridad: ${report.patterns.securityAlerts}`);
    console.log(`   Errores JWT: ${report.patterns.jwtErrors}`);
    console.log(`   Operaciones exitosas: ${report.patterns.successfulOperations}`);
    
    console.log('\n🚨 TOP 5 ERRORES:');
    report.topErrors.forEach(({ error, count }, index) => {
      console.log(`   ${index + 1}. (${count}x) ${error.substring(0, 80)}...`);
    });
    
    console.log('\n⚠️ TOP 5 ADVERTENCIAS:');
    report.topWarnings.forEach(({ warning, count }, index) => {
      console.log(`   ${index + 1}. (${count}x) ${warning.substring(0, 80)}...`);
    });
    
    console.log('\n💡 RECOMENDACIONES:');
    report.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priorityIcon} ${rec.issue} (${rec.count} ocurrencias)`);
      console.log(`      Solución: ${rec.solution}`);
      console.log(`      Acción: ${rec.action}`);
      console.log('');
    });
    
    console.log('=' .repeat(50));
  }
}

// Función principal
function main() {
  const analyzer = new LogAnalyzer();
  
  // Si se proporciona un archivo como argumento
  const logFile = process.argv[2];
  
  if (logFile && fs.existsSync(logFile)) {
    console.log(`📖 Analizando archivo: ${logFile}`);
    const content = fs.readFileSync(logFile, 'utf8');
    const report = analyzer.analyze(content);
    analyzer.printReport(report);
  } else {
    console.log('📋 Uso: node analyze-logs.js [archivo_log]');
    console.log('📋 O pega los logs directamente en la consola');
    
    // Leer desde stdin si no hay archivo
    process.stdin.setEncoding('utf8');
    let data = '';
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      if (data.trim()) {
        const report = analyzer.analyze(data);
        analyzer.printReport(report);
      }
    });
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { LogAnalyzer }; 