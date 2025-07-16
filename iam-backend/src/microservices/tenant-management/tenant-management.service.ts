import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { Rol } from '@prisma/client';

export interface TenantInfo {
  id: number;
  name: string;
  industry: string;
  plan: string;
  userCount: number;
  activeUsers: number;
  createdAt: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TenantAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  totalMovements: number;
  lastActivity: Date;
}

@Injectable()
export class TenantManagementService {
  private readonly logger = new Logger(TenantManagementService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async getAllTenants(): Promise<TenantInfo[]> {
    try {
      const empresas = await this.prisma.empresa.findMany({
        include: {
          usuarios: true,
        },
      });

      return empresas.map(empresa => ({
        id: empresa.id,
        name: empresa.nombre,
        industry: empresa.TipoIndustria,
        plan: 'basic', // Por defecto
        userCount: empresa.usuarios.length,
        activeUsers: empresa.usuarios.filter(u => u.activo).length,
        createdAt: empresa.fechaCreacion,
        status: 'active' as const,
      }));
    } catch (error) {
      this.logger.error('Error getting all tenants:', error);
      throw error;
    }
  }

  async getTenant(id: number): Promise<TenantInfo> {
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id },
        include: {
          usuarios: true,
        },
      });

      if (!empresa) {
        throw new Error(`Tenant with id ${id} not found`);
      }

      return {
        id: empresa.id,
        name: empresa.nombre,
        industry: empresa.TipoIndustria,
        plan: 'basic',
        userCount: empresa.usuarios.length,
        activeUsers: empresa.usuarios.filter(u => u.activo).length,
        createdAt: empresa.fechaCreacion,
        status: 'active' as const,
      };
    } catch (error) {
      this.logger.error(`Error getting tenant ${id}:`, error);
      throw error;
    }
  }

  async createTenant(tenantData: any): Promise<TenantInfo> {
    try {
      const empresa = await this.prisma.empresa.create({
        data: {
          nombre: tenantData.name,
          TipoIndustria: tenantData.industry || 'GENERICA',
          emailContacto: tenantData.email,
          direccion: tenantData.address,
        },
      });

      return {
        id: empresa.id,
        name: empresa.nombre,
        industry: empresa.TipoIndustria,
        plan: 'basic',
        userCount: 0,
        activeUsers: 0,
        createdAt: empresa.fechaCreacion,
        status: 'active' as const,
      };
    } catch (error) {
      this.logger.error('Error creating tenant:', error);
      throw error;
    }
  }

  async updateTenant(id: number, updateData: any): Promise<TenantInfo> {
    try {
      const empresa = await this.prisma.empresa.update({
        where: { id },
        data: {
          nombre: updateData.name,
          TipoIndustria: updateData.industry,
          emailContacto: updateData.email,
          direccion: updateData.address,
        },
        include: {
          usuarios: true,
        },
      });

      return {
        id: empresa.id,
        name: empresa.nombre,
        industry: empresa.TipoIndustria,
        plan: 'basic',
        userCount: empresa.usuarios.length,
        activeUsers: empresa.usuarios.filter(u => u.activo).length,
        createdAt: empresa.fechaCreacion,
        status: 'active' as const,
      };
    } catch (error) {
      this.logger.error(`Error updating tenant ${id}:`, error);
      throw error;
    }
  }

  async deleteTenant(id: number): Promise<void> {
    try {
      await this.prisma.empresa.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error deleting tenant ${id}:`, error);
      throw error;
    }
  }

  async getTenantUsers(tenantId: number): Promise<any[]> {
    try {
      const usuarios = await this.prisma.usuario.findMany({
        where: { empresaId: tenantId },
        select: {
          id: true,
          email: true,
          nombre: true,
          rol: true,
          activo: true,
          createdAt: true,
        },
      });

      return usuarios;
    } catch (error) {
      this.logger.error(`Error getting users for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async addUserToTenant(tenantId: number, userData: any): Promise<any> {
    try {
      const user = await this.usersService.create({
        email: userData.email,
        password: userData.password,
        nombre: userData.name,
        rol: userData.role || Rol.EMPLEADO,
        empresaId: tenantId.toString(),
      }, Rol.SUPERADMIN, tenantId);

      return user;
    } catch (error) {
      this.logger.error(`Error adding user to tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async removeUserFromTenant(tenantId: number, userId: number): Promise<void> {
    try {
      await this.prisma.usuario.update({
        where: { id: userId },
        data: { empresaId: null },
      });
    } catch (error) {
      this.logger.error(`Error removing user ${userId} from tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getTenantAnalytics(tenantId: number): Promise<TenantAnalytics> {
    try {
      const [totalUsers, activeUsers, totalProducts, totalMovements] = await Promise.all([
        this.prisma.usuario.count({ where: { empresaId: tenantId } }),
        this.prisma.usuario.count({ where: { empresaId: tenantId, activo: true } }),
        this.prisma.producto.count({ where: { empresaId: tenantId } }),
        this.prisma.movimientoInventario.count({ where: { empresaId: tenantId } }),
      ]);

      const lastActivity = await this.prisma.movimientoInventario.findFirst({
        where: { empresaId: tenantId },
        orderBy: { fecha: 'desc' },
        select: { fecha: true },
      });

      return {
        totalUsers,
        activeUsers,
        totalProducts,
        totalMovements,
        lastActivity: lastActivity?.fecha || new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting analytics for tenant ${tenantId}:`, error);
      throw error;
    }
  }
} 