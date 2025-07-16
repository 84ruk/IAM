import { Injectable, BadRequestException } from '@nestjs/common';
import { SecureLoggerService } from './secure-logger.service';

@Injectable()
export class ValidationService {
  constructor(private secureLogger: SecureLoggerService) {}

  /**
   * Validar y sanitizar email
   */
  validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException(
        'Email es requerido y debe ser una cadena de texto',
      );
    }

    // Sanitizar email
    const sanitizedEmail = email.trim().toLowerCase();

    // Validar formato básico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new BadRequestException('Formato de email inválido');
    }

    // Validar longitud
    if (sanitizedEmail.length > 254) {
      throw new BadRequestException('Email demasiado largo');
    }

    // Validar caracteres sospechosos
    if (this.containsSuspiciousCharacters(sanitizedEmail)) {
      this.secureLogger.logSuspiciousActivity(
        `Email con caracteres sospechosos: ${this.maskEmail(sanitizedEmail)}`,
      );
      throw new BadRequestException('Email contiene caracteres no permitidos');
    }

    return sanitizedEmail;
  }

  /**
   * Validar y sanitizar contraseña
   */
  validatePassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new BadRequestException(
        'Contraseña es requerida y debe ser una cadena de texto',
      );
    }

    // Validar longitud mínima
    if (password.length < 12) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 12 caracteres',
      );
    }

    // Validar longitud máxima
    if (password.length > 128) {
      throw new BadRequestException(
        'La contraseña no puede exceder 128 caracteres',
      );
    }

    // Validar complejidad
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[@$!%*?&]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumbers || !hasSpecialChars) {
      throw new BadRequestException(
        'La contraseña debe contener mayúsculas, minúsculas, números y símbolos (@$!%*?&)',
      );
    }

    // Validar caracteres sospechosos
    if (this.containsSuspiciousCharacters(password)) {
      this.secureLogger.logSuspiciousActivity(
        'Contraseña con caracteres sospechosos',
      );
      throw new BadRequestException(
        'La contraseña contiene caracteres no permitidos',
      );
    }

    // Validar patrones comunes de contraseñas débiles
    if (this.isWeakPassword(password)) {
      throw new BadRequestException('La contraseña es demasiado débil');
    }

    return password;
  }

  /**
   * Validar y sanitizar nombre
   */
  validateName(name: string, fieldName: string = 'nombre'): string {
    if (!name || typeof name !== 'string') {
      throw new BadRequestException(
        `${fieldName} es requerido y debe ser una cadena de texto`,
      );
    }

    // Sanitizar nombre
    const sanitizedName = name.trim();

    // Validar longitud
    if (sanitizedName.length < 2) {
      throw new BadRequestException(
        `${fieldName} debe tener al menos 2 caracteres`,
      );
    }

    if (sanitizedName.length > 50) {
      throw new BadRequestException(
        `${fieldName} no puede exceder 50 caracteres`,
      );
    }

    // Validar caracteres permitidos
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/;
    if (!nameRegex.test(sanitizedName)) {
      throw new BadRequestException(
        `${fieldName} contiene caracteres no permitidos`,
      );
    }

    // Validar caracteres sospechosos
    if (this.containsSuspiciousCharacters(sanitizedName)) {
      this.secureLogger.logSuspiciousActivity(
        `${fieldName} con caracteres sospechosos: ${this.maskName(sanitizedName)}`,
      );
      throw new BadRequestException(
        `${fieldName} contiene caracteres no permitidos`,
      );
    }

    return sanitizedName;
  }

  /**
   * Validar y sanitizar nombre de empresa
   */
  validateEmpresaName(name: string): string {
    if (!name || typeof name !== 'string') {
      throw new BadRequestException(
        'El nombre de la empresa es requerido y debe ser una cadena de texto',
      );
    }

    // Sanitizar nombre
    const sanitizedName = name.trim();

    // Validar longitud
    if (sanitizedName.length < 2) {
      throw new BadRequestException(
        'El nombre de la empresa debe tener al menos 2 caracteres',
      );
    }

    if (sanitizedName.length > 100) {
      throw new BadRequestException(
        'El nombre de la empresa no puede exceder 100 caracteres',
      );
    }

    // Validar caracteres permitidos (más permisivo que nombres de usuario)
    const empresaNameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/;
    if (!empresaNameRegex.test(sanitizedName)) {
      throw new BadRequestException(
        'El nombre de la empresa contiene caracteres no permitidos',
      );
    }

    // Validar caracteres sospechosos
    if (this.containsSuspiciousCharacters(sanitizedName)) {
      this.secureLogger.logSuspiciousActivity(
        `Nombre de empresa con caracteres sospechosos: ${this.maskName(sanitizedName)}`,
      );
      throw new BadRequestException(
        'El nombre de la empresa contiene caracteres no permitidos',
      );
    }

    return sanitizedName;
  }

  /**
   * Validar URL
   */
  validateUrl(url: string, fieldName: string = 'URL'): string {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException(
        `${fieldName} es requerida y debe ser una cadena de texto`,
      );
    }

    const sanitizedUrl = url.trim();

    try {
      const urlObj = new URL(sanitizedUrl);

      // Validar protocolo
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new BadRequestException(
          `${fieldName} debe usar protocolo HTTP o HTTPS`,
        );
      }

      // Validar longitud
      if (sanitizedUrl.length > 2048) {
        throw new BadRequestException(`${fieldName} es demasiado larga`);
      }

      return sanitizedUrl;
    } catch (error) {
      throw new BadRequestException(`${fieldName} no es una URL válida`);
    }
  }

  /**
   * Validar número de teléfono
   */
  validatePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException(
        'El teléfono es requerido y debe ser una cadena de texto',
      );
    }

    const sanitizedPhone = phone.replace(/\s+/g, '');

    // Validar formato básico (números, +, -, espacios)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      throw new BadRequestException('Formato de teléfono inválido');
    }

    return sanitizedPhone;
  }

  /**
   * Detectar caracteres sospechosos
   */
  private containsSuspiciousCharacters(text: string): boolean {
    // Caracteres que podrían indicar inyección o ataques
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /<input/i,
      /<textarea/i,
      /<select/i,
      /<button/i,
      /<link/i,
      /<meta/i,
      /<style/i,
      /<title/i,
      /<body/i,
      /<head/i,
      /<html/i,
      /<xml/i,
      /<svg/i,
      /<math/i,
      /<applet/i,
      /<base/i,
      /<bgsound/i,
      /<link/i,
      /<meta/i,
      /<source/i,
      /<track/i,
      /<video/i,
      /<audio/i,
      /<canvas/i,
      /<command/i,
      /<datalist/i,
      /<details/i,
      /<dialog/i,
      /<fieldset/i,
      /<figure/i,
      /<figcaption/i,
      /<footer/i,
      /<header/i,
      /<hgroup/i,
      /<main/i,
      /<mark/i,
      /<menuitem/i,
      /<meter/i,
      /<nav/i,
      /<output/i,
      /<progress/i,
      /<section/i,
      /<summary/i,
      /<time/i,
      /<wbr/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Detectar contraseñas débiles
   */
  private isWeakPassword(password: string): boolean {
    // Patrones de contraseñas débiles
    const weakPatterns = [
      /^1234567890+$/,
      /^qwerty+$/i,
      /^password+$/i,
      /^admin+$/i,
      /^user+$/i,
      /^123456+$/,
      /^abcdef+$/i,
      /^111111+$/,
      /^000000+$/,
      /^aaaaaa+$/i,
      /^abc123+$/i,
      /^password123+$/i,
      /^admin123+$/i,
      /^user123+$/i,
    ];

    // Verificar si coincide con patrones débiles
    if (weakPatterns.some((pattern) => pattern.test(password))) {
      return true;
    }

    // Verificar si tiene secuencias repetitivas
    const hasRepeatingSequence = /(.)\1{3,}/.test(password);
    if (hasRepeatingSequence) {
      return true;
    }

    // Verificar si tiene secuencias numéricas
    const hasNumericSequence = /012|123|234|345|456|567|678|789/.test(password);
    if (hasNumericSequence) {
      return true;
    }

    return false;
  }

  /**
   * Enmascarar email para logging
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***';
    }

    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 3 ? `${localPart.substring(0, 3)}***` : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Enmascarar nombre para logging
   */
  private maskName(name: string): string {
    if (!name) return '***';

    return name
      .split(' ')
      .map((word) => (word.length > 1 ? `${word[0]}***` : '***'))
      .join(' ');
  }

  /**
   * Validar objeto completo
   */
  validateObject(obj: any, schema: Record<string, (value: any) => any>): any {
    const validated: any = {};

    for (const [key, validator] of Object.entries(schema)) {
      if (obj.hasOwnProperty(key)) {
        try {
          validated[key] = validator(obj[key]);
        } catch (error) {
          throw new BadRequestException(
            `Error en campo ${key}: ${error.message}`,
          );
        }
      }
    }

    return validated;
  }
}
