import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import * as DOMPurify from 'isomorphic-dompurify';

export interface ResourceRequirements {
  empresa?: 'required' | 'optional' | 'none' | 'forbidden';
  roles?: string[];
  permissions?: string[];
  ownership?: boolean;
  setupRequired?: boolean;
}

export interface ValidationContext {
  user: JwtUser;
  resourceId?: number;
  empresaId?: number;
  resource?: string;
  action?: string;
}

@Injectable()
export class SecurityValidator {
  
  /**
   * Valida el acceso a un recurso basado en los requisitos especificados
   */
  validateResourceAccess(
    requirements: ResourceRequirements,
    context: ValidationContext
  ): boolean {
    const { user } = context;

    // Validar empresa si es requerida
    if (requirements.empresa === 'required' && !user.empresaId) {
      throw new ForbiddenException('Empresa requerida para acceder a este recurso');
    }

    // Validar empresa si está prohibida
    if (requirements.empresa === 'forbidden' && user.empresaId) {
      throw new ForbiddenException('No se permite acceso con empresa asignada');
    }

    // Validar setup completado si es requerido
    if (requirements.setupRequired && !user.setupCompletado) {
      throw new BadRequestException('Debe completar la configuración inicial de la empresa');
    }

    // Validar roles si están especificados
    if (requirements.roles && requirements.roles.length > 0) {
      if (!requirements.roles.includes(user.rol)) {
        throw new ForbiddenException(`Rol requerido: ${requirements.roles.join(', ')}`);
      }
    }

    // Validar permisos si están especificados
    if (requirements.permissions && requirements.permissions.length > 0) {
      // Implementar lógica de permisos específicos si es necesario
      // Por ahora, solo validamos roles
    }

    // Validar propiedad del recurso si es requerida
    if (requirements.ownership && context.resourceId) {
      // Implementar lógica de propiedad si es necesario
      // Por ahora, solo validamos que el usuario tenga empresa
      if (!user.empresaId) {
        throw new ForbiddenException('Propiedad del recurso requerida');
      }
    }

    return true;
  }

  /**
   * Valida que el usuario tenga acceso a la empresa especificada
   */
  validateEmpresaAccess(user: JwtUser, empresaId: number): boolean {
    if (!user.empresaId) {
      throw new ForbiddenException('Usuario no tiene empresa asignada');
    }

    if (user.empresaId !== empresaId) {
      throw new ForbiddenException('Acceso denegado a esta empresa');
    }

    return true;
  }

  /**
   * Valida y sanitiza un DTO completo
   */
  validateAndSanitizeDto<T extends Record<string, any>>(
    dto: T,
    allowedFields: string[]
  ): T {
    const sanitized: any = {};

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        sanitized[field] = this.sanitizeValue(dto[field]);
      }
    }

    return sanitized as T;
  }

  /**
   * Sanitiza un valor individual
   */
  sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value.trim());
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeValue(item));
      }
      
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Valida parámetros de paginación
   */
  validatePagination(page?: number, limit?: number): { page: number; limit: number } {
    const validatedPage = page && page > 0 ? page : 1;
    const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 10;

    return {
      page: validatedPage,
      limit: validatedLimit
    };
  }

  /**
   * Valida que un usuario pueda modificar a otro usuario
   */
  validateUserModification(
    currentUser: JwtUser,
    targetUserId: number,
    targetUserEmpresaId?: number
  ): boolean {
    // Super admin puede modificar cualquier usuario
    if (currentUser.rol === 'SUPERADMIN') {
      return true;
    }

    // Admin solo puede modificar usuarios de su empresa
    if (currentUser.rol === 'ADMIN') {
      if (!currentUser.empresaId) {
        throw new ForbiddenException('Admin debe tener empresa asignada');
      }

      if (targetUserEmpresaId && currentUser.empresaId !== targetUserEmpresaId) {
        throw new ForbiddenException('Solo puede modificar usuarios de su empresa');
      }

      return true;
    }

    // Usuarios normales solo pueden modificar su propio perfil
    if (currentUser.id === targetUserId) {
      return true;
    }

    throw new ForbiddenException('No tiene permisos para modificar este usuario');
  }

  /**
   * Valida que un usuario pueda eliminar un recurso
   */
  validateResourceDeletion(
    currentUser: JwtUser,
    resourceEmpresaId?: number
  ): boolean {
    // Super admin puede eliminar cualquier recurso
    if (currentUser.rol === 'SUPERADMIN') {
      return true;
    }

    // Admin solo puede eliminar recursos de su empresa
    if (currentUser.rol === 'ADMIN') {
      if (!currentUser.empresaId) {
        throw new ForbiddenException('Admin debe tener empresa asignada');
      }

      if (resourceEmpresaId && currentUser.empresaId !== resourceEmpresaId) {
        throw new ForbiddenException('Solo puede eliminar recursos de su empresa');
      }

      return true;
    }

    throw new ForbiddenException('No tiene permisos para eliminar recursos');
  }

  /**
   * Valida que un usuario pueda crear recursos
   */
  validateResourceCreation(
    currentUser: JwtUser,
    empresaId?: number
  ): boolean {
    // Super admin puede crear recursos en cualquier empresa
    if (currentUser.rol === 'SUPERADMIN') {
      return true;
    }

    // Admin y usuarios normales necesitan empresa
    if (!currentUser.empresaId) {
      throw new ForbiddenException('Usuario debe tener empresa asignada');
    }

    // Si se especifica una empresa, debe coincidir con la del usuario
    if (empresaId && currentUser.empresaId !== empresaId) {
      throw new ForbiddenException('Solo puede crear recursos en su empresa');
    }

    return true;
  }

  /**
   * Valida que un usuario pueda ver recursos
   */
  validateResourceView(
    currentUser: JwtUser,
    resourceEmpresaId?: number
  ): boolean {
    // Super admin puede ver cualquier recurso
    if (currentUser.rol === 'SUPERADMIN') {
      return true;
    }

    // Admin y usuarios normales necesitan empresa
    if (!currentUser.empresaId) {
      throw new ForbiddenException('Usuario debe tener empresa asignada');
    }

    // Si el recurso tiene empresa, debe coincidir con la del usuario
    if (resourceEmpresaId && currentUser.empresaId !== resourceEmpresaId) {
      throw new ForbiddenException('Solo puede ver recursos de su empresa');
    }

    return true;
  }

  /**
   * Valida que un usuario tenga setup completado
   */
  validateSetupCompleted(user: JwtUser): boolean {
    if (!user.setupCompletado) {
      throw new BadRequestException('Debe completar la configuración inicial de la empresa');
    }
    return true;
  }

  /**
   * Valida que un usuario esté activo
   */
  validateUserActive(user: JwtUser): boolean {
    // Por ahora, asumimos que todos los usuarios están activos
    // ya que no hay campo activo en JwtUser
    return true;
  }

  /**
   * Valida el acceso de un usuario
   */
  validateUserAccess(context: ValidationContext, requirements: ResourceRequirements): boolean {
    return this.validateResourceAccess(requirements, context);
  }

  /**
   * Sanitiza input
   */
  sanitizeInput(input: any): any {
    return this.sanitizeValue(input);
  }

  /**
   * Valida email
   */
  validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email inválido');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Formato de email inválido');
    }
    return email.trim().toLowerCase();
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePasswordStrength(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Contraseña inválida');
    }
    if (password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }
    return password;
  }

  /**
   * Valida permisos de modificación de usuario
   */
  validateUserModificationPermissions(
    currentUser: JwtUser,
    targetUserId: number,
    targetUserEmpresaId?: number
  ): boolean {
    return this.validateUserModification(currentUser, targetUserId, targetUserEmpresaId);
  }
} 