import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsQueryDto, DashboardStatsResponseDto } from './dto/dashboard-stats.dto';
import { GetUsersQueryDto, UsersPaginatedResponseDto, BulkUserActionDto } from './dto/users.dto';
import { GetStatsQueryDto, SystemStatsResponseDto } from './dto/stats.dto';
import { GetAuditLogsQueryDto, AuditLogsPaginatedResponseDto, AuditStatsResponseDto } from './dto/audit.dto';
import { SystemConfigDto, TestEmailDto } from './dto/config.dto';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats(query: DashboardStatsQueryDto): Promise<DashboardStatsResponseDto> {
    const { range = '30d' } = query;
    const dateFilter = this.getDateFilter(range);

    // Obtener estadísticas generales
    const [
      totalUsers,
      activeUsers,
      totalEmpresas,
      totalProductos,
      totalMovimientos,
      usersByRole,
      empresasByIndustry,
      recentUsers,
      recentEmpresas
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({ where: { activo: true } }),
      this.prisma.empresa.count(),
      this.prisma.producto.count(),
      this.prisma.movimientoInventario.count(),
      this.getUsersByRole(),
      this.getEmpresasByIndustry(),
      this.getRecentUsers(),
      this.getRecentEmpresas()
    ]);

    const inactiveUsers = totalUsers - activeUsers;
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Simular métricas del sistema (en producción vendrían de monitoreo real)
    const systemHealth = this.getSystemHealth();

    return {
      overview: {
        totalUsers,
        totalEmpresas,
        activeUsers,
        inactiveUsers,
        activePercentage,
        totalProductos,
        totalMovimientos
      },
      usersByRole,
      empresasByIndustry,
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        createdAt: u.createdAt,
        empresa: u.empresa ? { id: u.empresa.id, nombre: u.empresa.nombre } : { id: 0, nombre: '' }
      })),
      recentEmpresas,
      systemHealth
    };
  }

  // ==================== USERS MANAGEMENT ====================
  async getUsers(query: GetUsersQueryDto): Promise<UsersPaginatedResponseDto> {
    const { page = 1, limit = 20, search, role, status, empresaId } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { empresa: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (role) {
      where.rol = role;
    }

    if (status !== undefined) {
      where.activo = status === 'true';
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    // Obtener usuarios con paginación
    const [users, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true,
              TipoIndustria: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.usuario.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      users: users.map(user => ({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
        createdAt: user.createdAt.toISOString(),
        empresa: user.empresa ? {
          id: user.empresa.id,
          nombre: user.empresa.nombre,
          TipoIndustria: user.empresa.TipoIndustria
        } : undefined
      })),
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.rol === 'SUPERADMIN') {
      throw new ForbiddenException('No se puede eliminar un Super Administrador');
    }

    await this.prisma.usuario.delete({
      where: { id: userId }
    });
  }

  async activateUser(userId: number): Promise<void> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { activo: true }
    });
  }

  async deactivateUser(userId: number): Promise<void> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.rol === 'SUPERADMIN') {
      throw new ForbiddenException('No se puede desactivar un Super Administrador');
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { activo: false }
    });
  }

  async bulkActivateUsers(userIds: number[]): Promise<void> {
    await this.prisma.usuario.updateMany({
      where: {
        id: { in: userIds },
        rol: { not: 'SUPERADMIN' } // Proteger super admins
      },
      data: { activo: true }
    });
  }

  async bulkDeactivateUsers(userIds: number[]): Promise<void> {
    await this.prisma.usuario.updateMany({
      where: {
        id: { in: userIds },
        rol: { not: 'SUPERADMIN' } // Proteger super admins
      },
      data: { activo: false }
    });
  }

  async bulkDeleteUsers(userIds: number[]): Promise<void> {
    await this.prisma.usuario.deleteMany({
      where: {
        id: { in: userIds },
        rol: { not: 'SUPERADMIN' } // Proteger super admins
      }
    });
  }

  // ==================== EMPRESAS MANAGEMENT ====================
  async getEmpresas() {
    return this.prisma.empresa.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
            movimientos: true
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });
  }

  async getEmpresaStats(empresaId: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        usuarios: {
          select: {
            id: true,
            rol: true,
            activo: true
          }
        },
        productos: true,
        movimientos: true
      }
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const usersByRole = await this.prisma.usuario.groupBy({
      by: ['rol'],
      where: { empresaId },
      _count: { rol: true }
    });

    return {
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        TipoIndustria: empresa.TipoIndustria
      },
      stats: {
        totalUsers: empresa.usuarios.length,
        activeUsers: empresa.usuarios.filter(u => u.activo).length,
        totalProductos: empresa.productos.length,
        totalMovimientos: empresa.movimientos.length,
        totalProveedores: empresa.usuarios.filter(u => u.rol === 'PROVEEDOR').length
      },
      usersByRole: usersByRole.map(group => ({
        rol: group.rol,
        count: group._count.rol,
        label: this.getRoleLabel(group.rol)
      }))
    };
  }

  // ==================== ADVANCED STATS ====================
  async getSystemStats(query: GetStatsQueryDto): Promise<SystemStatsResponseDto> {
    const { range = '30d' } = query;
    const dateFilter = this.getDateFilter(range);
    const previousDateFilter = this.getPreviousDateFilter(range);

    // Obtener datos actuales
    const [
      currentStats,
      previousStats,
      usersByRole,
      empresasByIndustry,
      activityByMonth,
      topEmpresas
    ] = await Promise.all([
      this.getCurrentPeriodStats(dateFilter),
      this.getCurrentPeriodStats(previousDateFilter),
      this.getUsersByRoleWithPercentage(),
      this.getEmpresasByIndustryWithPercentage(),
      this.getActivityByMonth(),
      this.getTopEmpresas()
    ]);

    // Calcular crecimiento
    const growth = this.calculateGrowth(currentStats, previousStats);

    // Simular métricas del sistema
    const systemMetrics = this.getSystemMetrics();

    return {
      overview: currentStats,
      growth,
      usersByRole,
      empresasByIndustry,
      activityByMonth,
      topEmpresas,
      systemMetrics
    };
  }

  // ==================== AUDIT LOGS ====================
  async getAuditLogs(query: GetAuditLogsQueryDto): Promise<AuditLogsPaginatedResponseDto> {
    const { page = 1, limit = 50, search, action, resource, user } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (user) {
      where.userEmail = { contains: user, mode: 'insensitive' };
    }

    // Obtener logs con paginación
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.auditLog.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      logs: logs.map(log => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.userEmail,
        userName: log.userName,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || 0,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
        empresaId: log.empresaId === null ? undefined : log.empresaId,
        empresaName: log.empresaName === null ? undefined : log.empresaName
      })),
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }

  async getAuditStats(range: string): Promise<AuditStatsResponseDto> {
    const dateFilter = this.getDateFilter(range as any);

    const [
      totalLogs,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      topActions,
      topUsers,
      topResources
    ] = await Promise.all([
      this.prisma.auditLog.count({ where: dateFilter }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      this.getTopAuditActions(dateFilter),
      this.getTopAuditUsers(dateFilter),
      this.getTopAuditResources(dateFilter)
    ]);

    return {
      totalLogs,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      topActions,
      topUsers,
      topResources
    };
  }

  // ==================== CONFIGURATION ====================
  async getSystemConfig(): Promise<SystemConfigDto> {
    // En producción, esto vendría de una base de datos de configuración
    // Por ahora, retornamos configuración por defecto
    return {
      security: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        enableTwoFactor: false,
        enableAuditLog: true
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@iam-system.com',
        fromName: 'IAM System',
        enableEmailNotifications: true
      },
      system: {
        maintenanceMode: false,
        maintenanceMessage: 'El sistema está en mantenimiento. Por favor, intente más tarde.',
        maxFileSize: 10,
        allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'xlsx'],
        backupFrequency: 'daily',
        backupRetention: 30,
        enableAutoBackup: true
      },
      notifications: {
        enableEmailAlerts: true,
        enableSystemAlerts: true,
        alertThreshold: 5,
        notifyOnUserCreation: true,
        notifyOnUserDeletion: true,
        notifyOnSystemErrors: true
      }
    };
  }

  async updateSystemConfig(config: SystemConfigDto): Promise<void> {
    // En producción, esto guardaría en una base de datos de configuración
    // Por ahora, solo validamos y simulamos guardado
    console.log('Configuración actualizada:', config);
  }

  async testEmailConfig(testEmail: TestEmailDto): Promise<void> {
    // En producción, esto enviaría un email real
    console.log('Email de prueba enviado a:', testEmail.to);
  }

  async backupNow(): Promise<void> {
    // En producción, esto iniciaría un backup real
    console.log('Backup iniciado');
  }

  // ==================== HELPER METHODS ====================
  private getDateFilter(range: string) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { createdAt: { gte: startDate } };
  }

  private getPreviousDateFilter(range: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { createdAt: { gte: startDate, lt: endDate } };
  }

  private async getUsersByRole() {
    const result = await this.prisma.usuario.groupBy({
      by: ['rol'],
      _count: { rol: true }
    });

    return result.map(group => ({
      rol: group.rol,
      count: group._count.rol,
      label: this.getRoleLabel(group.rol)
    }));
  }

  private async getUsersByRoleWithPercentage() {
    const result = await this.prisma.usuario.groupBy({
      by: ['rol'],
      _count: { rol: true }
    });

    const total = result.reduce((sum, group) => sum + group._count.rol, 0);

    return result.map(group => ({
      rol: group.rol,
      count: group._count.rol,
      label: this.getRoleLabel(group.rol),
      percentage: total > 0 ? (group._count.rol / total) * 100 : 0
    }));
  }

  private async getEmpresasByIndustry() {
    const result = await this.prisma.empresa.groupBy({
      by: ['TipoIndustria'],
      _count: { TipoIndustria: true }
    });

    return result.map(group => ({
      industry: group.TipoIndustria,
      count: group._count.TipoIndustria
    }));
  }

  private async getEmpresasByIndustryWithPercentage() {
    const result = await this.prisma.empresa.groupBy({
      by: ['TipoIndustria'],
      _count: { TipoIndustria: true }
    });

    const total = result.reduce((sum, group) => sum + group._count.TipoIndustria, 0);

    return result.map(group => ({
      industry: group.TipoIndustria,
      count: group._count.TipoIndustria,
      percentage: total > 0 ? (group._count.TipoIndustria / total) * 100 : 0
    }));
  }

  private async getRecentUsers() {
    return this.prisma.usuario.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    }).then(users => users.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      createdAt: user.createdAt.toISOString(),
      empresa: user.empresa ? {
        id: user.empresa.id,
        nombre: user.empresa.nombre
      } : undefined
    })));
  }

  private async getRecentEmpresas() {
    return this.prisma.empresa.findMany({
      take: 5,
      orderBy: { fechaCreacion: 'desc' }
    }).then(empresas => empresas.map(empresa => ({
      id: empresa.id,
      nombre: empresa.nombre,
      TipoIndustria: empresa.TipoIndustria,
      fechaCreacion: empresa.fechaCreacion.toISOString()
    })));
  }

  private async getCurrentPeriodStats(dateFilter: any) {
    const [totalUsers, activeUsers, totalEmpresas, totalProductos, totalMovimientos] = await Promise.all([
      this.prisma.usuario.count({ where: dateFilter }),
      this.prisma.usuario.count({ where: { ...dateFilter, activo: true } }),
      this.prisma.empresa.count({ where: dateFilter }),
      this.prisma.producto.count({ where: dateFilter }),
      this.prisma.movimientoInventario.count({ where: dateFilter })
    ]);

    const inactiveUsers = totalUsers - activeUsers;
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      totalEmpresas,
      totalProductos,
      totalMovimientos,
      activeUsers,
      inactiveUsers,
      activePercentage
    };
  }

  private calculateGrowth(current: any, previous: any) {
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      usersGrowth: calculateGrowthRate(current.totalUsers, previous.totalUsers),
      empresasGrowth: calculateGrowthRate(current.totalEmpresas, previous.totalEmpresas),
      productosGrowth: calculateGrowthRate(current.totalProductos, previous.totalProductos),
      movimientosGrowth: calculateGrowthRate(current.totalMovimientos, previous.totalMovimientos)
    };
  }

  private async getActivityByMonth() {
    // Simular datos de actividad por mes
    const months: Array<{
      month: string;
      users: number;
      empresas: number;
      productos: number;
      movimientos: number;
    }> = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        users: Math.floor(Math.random() * 50) + 10,
        empresas: Math.floor(Math.random() * 20) + 5,
        productos: Math.floor(Math.random() * 200) + 50,
        movimientos: Math.floor(Math.random() * 500) + 100
      });
    }

    return months;
  }

  private async getTopEmpresas() {
    return this.prisma.empresa.findMany({
      take: 10,
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
            movimientos: true
          }
        }
      },
      orderBy: {
        movimientos: {
          _count: 'desc'
        }
      }
    }).then(empresas => empresas.map(empresa => ({
      id: empresa.id,
      nombre: empresa.nombre,
      TipoIndustria: empresa.TipoIndustria,
      totalUsers: empresa._count.usuarios,
      totalProductos: empresa._count.productos,
      totalMovimientos: empresa._count.movimientos
    })));
  }

  private async getTopAuditActions(dateFilter: any) {
    const result = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: dateFilter,
      _count: { action: true }
    });

    const total = result.reduce((sum, group) => sum + group._count.action, 0);

    return result.map(group => ({
      action: group.action,
      count: group._count.action,
      percentage: total > 0 ? (group._count.action / total) * 100 : 0
    }));
  }

  private async getTopAuditUsers(dateFilter: any) {
    const result = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userName', 'userEmail'],
      where: dateFilter,
      _count: { userId: true }
    });

    return result
      .sort((a, b) => b._count.userId - a._count.userId)
      .slice(0, 10)
      .map(group => ({
        userId: group.userId,
        userName: group.userName,
        userEmail: group.userEmail,
        actionCount: group._count.userId
      }));
  }

  private async getTopAuditResources(dateFilter: any) {
    const result = await this.prisma.auditLog.groupBy({
      by: ['resource'],
      where: dateFilter,
      _count: { resource: true }
    });

    const total = result.reduce((sum, group) => sum + group._count.resource, 0);

    return result.map(group => ({
      resource: group.resource,
      count: group._count.resource,
      percentage: total > 0 ? (group._count.resource / total) * 100 : 0
    }));
  }

  private getSystemHealth() {
    // Simular estado del sistema
    return {
      status: 'healthy' as const,
      message: 'Sistema operativo',
      uptime: '99.9%',
      lastBackup: new Date().toISOString()
    };
  }

  private getSystemMetrics() {
    // Simular métricas del sistema
    return {
      uptime: '99.9%',
      responseTime: '150ms',
      errorRate: '0.1%',
      lastBackup: new Date().toISOString(),
      storageUsed: '2.5 GB',
      storageTotal: '10 GB'
    };
  }

  private getRoleLabel(rol: string): string {
    switch (rol) {
      case 'SUPERADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'EMPLEADO':
        return 'Empleado';
      case 'PROVEEDOR':
        return 'Proveedor';
      default:
        return rol;
    }
  }
} 