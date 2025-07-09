import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtAuditService {
  private readonly logger = new Logger(JwtAuditService.name);
  private readonly auditEnabled = process.env.JWT_AUDIT_ENABLED === 'true';
  private readonly auditLogPath = process.env.JWT_AUDIT_LOG_PATH || './logs/jwt-audit.log';

  logJwtEvent(event: string, userId?: number, email?: string, additionalData?: any) {
    if (!this.auditEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      email,
      ip: additionalData?.ip,
      userAgent: additionalData?.userAgent,
      ...additionalData,
    };

    // Log a consola
    this.logger.log(`JWT Audit: ${event} - User: ${email || userId}`);

    // Log a archivo
    try {
      const logDir = path.dirname(this.auditLogPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.appendFileSync(this.auditLogPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      this.logger.error(`Error writing to audit log: ${error.message}`);
    }
  }

  logLogin(userId: number, email: string, additionalData?: any) {
    this.logJwtEvent('LOGIN', userId, email, additionalData);
  }

  logLogout(userId: number, email: string, additionalData?: any) {
    this.logJwtEvent('LOGOUT', userId, email, additionalData);
  }

  logTokenRefresh(userId: number, email: string, additionalData?: any) {
    this.logJwtEvent('TOKEN_REFRESH', userId, email, additionalData);
  }

  logInvalidToken(reason: string, additionalData?: any) {
    this.logJwtEvent('INVALID_TOKEN', undefined, undefined, { reason, ...additionalData });
  }

  // Nuevos métodos para auditoría de setup
  logSetupCheck(userId: number, email: string, needsSetup: boolean, additionalData?: any) {
    this.logJwtEvent('SETUP_CHECK', userId, email, {
      needsSetup,
      action: 'check',
      ...additionalData,
    });
  }

  logSetupStarted(userId: number, email: string, additionalData?: any) {
    this.logJwtEvent('SETUP_STARTED', userId, email, {
      action: 'start',
      ...additionalData,
    });
  }

  logSetupCompleted(userId: number, email: string, empresaId: number, additionalData?: any) {
    this.logJwtEvent('SETUP_COMPLETED', userId, email, {
      action: 'complete',
      empresaId,
      ...additionalData,
    });
  }

  logSetupFailed(userId: number, email: string, error: string, additionalData?: any) {
    this.logJwtEvent('SETUP_FAILED', userId, email, {
      action: 'fail',
      error,
      ...additionalData,
    });
  }

  logGuardAccess(userId: number, email: string, guardType: string, allowed: boolean, additionalData?: any) {
    this.logJwtEvent('GUARD_ACCESS', userId, email, {
      guardType,
      allowed,
      action: 'access_check',
      ...additionalData,
    });
  }

  logEmpresaValidation(userId: number, email: string, empresaId: number, isValid: boolean, additionalData?: any) {
    this.logJwtEvent('EMPRESA_VALIDATION', userId, email, {
      empresaId,
      isValid,
      action: 'validation',
      ...additionalData,
    });
  }

  logRaceCondition(userId: number, email: string, operation: string, additionalData?: any) {
    this.logJwtEvent('RACE_CONDITION', userId, email, {
      operation,
      action: 'race_detected',
      ...additionalData,
    });
  }
} 