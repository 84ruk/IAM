import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  userId: number;
  userEmail: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  empresaId?: number;
  empresaName?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          empresaId: data.empresaId,
          empresaName: data.empresaName,
        },
      });
    } catch (error) {
      // En producción, esto debería ir a un logger real
      console.error('Error logging audit event:', error);
    }
  }

  async logUserAction(
    userId: number,
    userEmail: string,
    userName: string,
    action: string,
    resource: string,
    resourceId: number,
    details: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logLogin(
    userId: number,
    userEmail: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'LOGIN',
      resource: 'AUTH',
      details: 'Inicio de sesión exitoso',
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logLogout(
    userId: number,
    userEmail: string,
    userName: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'LOGOUT',
      resource: 'AUTH',
      details: 'Cierre de sesión',
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logUserCreation(
    userId: number,
    userEmail: string,
    userName: string,
    createdUserId: number,
    createdUserEmail: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'CREATE',
      resource: 'USER',
      resourceId: createdUserId,
      details: `Usuario creado: ${createdUserEmail}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logUserUpdate(
    userId: number,
    userEmail: string,
    userName: string,
    updatedUserId: number,
    updatedUserEmail: string,
    changes: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: updatedUserId,
      details: `Usuario actualizado: ${updatedUserEmail} - Cambios: ${changes}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logUserDeletion(
    userId: number,
    userEmail: string,
    userName: string,
    deletedUserId: number,
    deletedUserEmail: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'DELETE',
      resource: 'USER',
      resourceId: deletedUserId,
      details: `Usuario eliminado: ${deletedUserEmail}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logUserStatusChange(
    userId: number,
    userEmail: string,
    userName: string,
    targetUserId: number,
    targetUserEmail: string,
    newStatus: boolean,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    const status = newStatus ? 'activado' : 'desactivado';
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: targetUserId,
      details: `Usuario ${status}: ${targetUserEmail}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logEmpresaCreation(
    userId: number,
    userEmail: string,
    userName: string,
    empresaId: number,
    empresaName: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action: 'CREATE',
      resource: 'EMPRESA',
      resourceId: empresaId,
      details: `Empresa creada: ${empresaName}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logProductoAction(
    userId: number,
    userEmail: string,
    userName: string,
    action: string,
    productoId: number,
    productoNombre: string,
    details: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action,
      resource: 'PRODUCTO',
      resourceId: productoId,
      details: `${details}: ${productoNombre}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logMovimientoAction(
    userId: number,
    userEmail: string,
    userName: string,
    action: string,
    movimientoId: number,
    productoNombre: string,
    cantidad: number,
    tipo: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action,
      resource: 'MOVIMIENTO',
      resourceId: movimientoId,
      details: `${tipo} de ${cantidad} unidades del producto: ${productoNombre}`,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }

  async logSystemAction(
    userId: number,
    userEmail: string,
    userName: string,
    action: string,
    details: string,
    ipAddress: string,
    userAgent: string,
    empresaId?: number,
    empresaName?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userName,
      action,
      resource: 'SYSTEM',
      details,
      ipAddress,
      userAgent,
      empresaId,
      empresaName,
    });
  }
}
