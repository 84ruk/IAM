import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard y estadísticas globales
  async getDashboardStats() {
    const [
      totalUsers,
      totalEmpresas,
      activeUsers,
      inactiveUsers,
      usersByRole,
      empresasByIndustry,
      recentUsers,
      recentEmpresas
    ] = await Promise.all([
      // Total de usuarios
      this.prisma.usuario.count(),
      
      // Total de empresas
      this.prisma.empresa.count(),
      
      // Usuarios activos
      this.prisma.usuario.count({ where: { activo: true } }),
      
      // Usuarios inactivos
      this.prisma.usuario.count({ where: { activo: false } }),
      
      // Usuarios por rol
      this.prisma.usuario.groupBy({
        by: ['rol'],
        _count: { rol: true },
        where: { activo: true }
      }),
      
      // Empresas por industria
      this.prisma.empresa.groupBy({
        by: ['TipoIndustria'],
        _count: { TipoIndustria: true }
      }),
      
      // Usuarios recientes (últimos 7 días)
      this.prisma.usuario.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          createdAt: true,
          empresa: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Empresas recientes (últimos 7 días)
      this.prisma.empresa.findMany({
        where: {
          fechaCreacion: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          nombre: true,
          TipoIndustria: true,
          fechaCreacion: true
        },
        orderBy: { fechaCreacion: 'desc' },
        take: 10
      })
    ]);

    return {
      overview: {
        totalUsers,
        totalEmpresas,
        activeUsers,
        inactiveUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      usersByRole: usersByRole.map(item => ({
        rol: item.rol,
        count: item._count.rol,
        label: this.getRoleLabel(item.rol)
      })),
      empresasByIndustry: empresasByIndustry.map(item => ({
        industry: item.TipoIndustria,
        count: item._count.TipoIndustria
      })),
      recentUsers,
      recentEmpresas
    };
  }

  // Gestión de usuarios global
  async findAllUsers(query: any = {}) {
    const {
      search,
      role,
      status,
      empresaId,
      page = 1,
      limit = 20
    } = query;

    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.rol = role;
    }
    
    if (status !== undefined) {
      where.activo = status === 'true';
    }
    
    if (empresaId) {
      where.empresaId = parseInt(empresaId);
    }

    const [users, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          createdAt: true,
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
        take: parseInt(limit)
      }),
      this.prisma.usuario.count({ where })
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOneUser(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        authProvider: true,
        setupCompletado: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true,
            rfc: true,
            emailContacto: true
          }
        }
      }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async createUser(dto: CreateUserAdminDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Verificar que la empresa existe si se especifica
    if (dto.empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: parseInt(dto.empresaId) }
      });

      if (!empresa) {
        throw new NotFoundException('Empresa no encontrada');
      }
    }

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol,
        empresaId: dto.empresaId ? parseInt(dto.empresaId) : null,
        activo: true,
        setupCompletado: false
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  async updateUser(id: number, dto: UpdateUserAdminDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar email único si se está actualizando
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
    }

    // Verificar que la empresa existe si se especifica
    if (dto.empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: parseInt(dto.empresaId) }
      });

      if (!empresa) {
        throw new NotFoundException('Empresa no encontrada');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.email) updateData.email = dto.email;
    if (dto.rol) updateData.rol = dto.rol;
    if (dto.activo !== undefined) updateData.activo = dto.activo;
    
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.empresaId) {
      updateData.empresaId = parseInt(dto.empresaId);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  async changeUserRole(id: number, dto: ChangeRoleDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { rol: dto.rol },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  async activateUser(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.activo) {
      throw new BadRequestException('El usuario ya está activo');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  async deactivateUser(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.activo) {
      throw new BadRequestException('El usuario ya está inactivo');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  async removeUser(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Soft delete - marcar como inactivo
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });
  }

  // Gestión de empresas
  async findAllEmpresas() {
    return this.prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        rfc: true,
        emailContacto: true,
        TipoIndustria: true,
        fechaCreacion: true,
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

  async findOneEmpresa(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        emailContacto: true,
        direccion: true,
        TipoIndustria: true,
        fechaCreacion: true,
        _count: {
          select: {
            usuarios: true,
            productos: true,
            movimientos: true,
            proveedores: true
          }
        }
      }
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return empresa;
  }

  async getEmpresaUsers(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.prisma.usuario.findMany({
      where: { empresaId: id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getEmpresaStats(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const [
      totalUsers,
      activeUsers,
      totalProductos,
      totalMovimientos,
      totalProveedores,
      usersByRole
    ] = await Promise.all([
      this.prisma.usuario.count({ where: { empresaId: id } }),
      this.prisma.usuario.count({ where: { empresaId: id, activo: true } }),
      this.prisma.producto.count({ where: { empresaId: id } }),
      this.prisma.movimientoInventario.count({ where: { empresaId: id } }),
      this.prisma.proveedor.count({ where: { empresaId: id } }),
      this.prisma.usuario.groupBy({
        by: ['rol'],
        _count: { rol: true },
        where: { empresaId: id, activo: true }
      })
    ]);

    return {
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        TipoIndustria: empresa.TipoIndustria
      },
      stats: {
        totalUsers,
        activeUsers,
        totalProductos,
        totalMovimientos,
        totalProveedores
      },
      usersByRole: usersByRole.map(item => ({
        rol: item.rol,
        count: item._count.rol,
        label: this.getRoleLabel(item.rol)
      }))
    };
  }

  // Auditoría y logs
  async getAuditLogs(query: any = {}) {
    // Por ahora retornamos logs simulados
    // En una implementación real, esto vendría de una tabla de logs
    return {
      logs: [],
      message: 'Sistema de auditoría en desarrollo'
    };
  }

  async getSystemStats() {
    const [
      totalUsers,
      totalEmpresas,
      totalProductos,
      totalMovimientos,
      totalProveedores,
      activeUsers,
      inactiveUsers
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.empresa.count(),
      this.prisma.producto.count(),
      this.prisma.movimientoInventario.count(),
      this.prisma.proveedor.count(),
      this.prisma.usuario.count({ where: { activo: true } }),
      this.prisma.usuario.count({ where: { activo: false } })
    ]);

    return {
      totalUsers,
      totalEmpresas,
      totalProductos,
      totalMovimientos,
      totalProveedores,
      activeUsers,
      inactiveUsers,
      systemHealth: 'OK',
      lastBackup: new Date().toISOString()
    };
  }

  // Configuración del sistema
  async getSystemConfig() {
    // Por ahora retornamos configuración básica
    return {
      maintenanceMode: false,
      maxUsersPerEmpresa: 100,
      maxProductosPerEmpresa: 1000,
      systemVersion: '1.0.0',
      features: {
        googleOAuth: true,
        multiTenant: true,
        auditLogs: false
      }
    };
  }

  async updateSystemConfig(config: any) {
    // Por ahora solo validamos y retornamos
    return {
      message: 'Configuración actualizada',
      config
    };
  }

  async createInitialSuperAdmin() {
    // Verificar si ya existe un super admin
    const existingSuperAdmin = await this.prisma.usuario.findFirst({
      where: {
        rol: 'SUPERADMIN'
      }
    });

    if (existingSuperAdmin) {
      return {
        message: 'Ya existe un super admin en el sistema',
        email: existingSuperAdmin.email
      };
    }

    // Crear el super admin
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = await this.prisma.usuario.create({
      data: {
        nombre: 'Super Administrador',
        email: 'superadmin@iam.com',
        password: hashedPassword,
        rol: 'SUPERADMIN',
        activo: true,
        setupCompletado: true
      }
    });

    return {
      message: 'Super Admin creado exitosamente',
      email: superAdmin.email,
      password: 'SuperAdmin123!',
      warning: 'IMPORTANTE: Cambia la contraseña después del primer login'
    };
  }

  // Utilidades
  private getRoleLabel(rol: Rol): string {
    switch (rol) {
      case 'SUPERADMIN':
        return 'Super Administrador';
      case 'ADMIN':
        return 'Administrador';
      case 'EMPLEADO':
        return 'Empleado';
      case 'PROVEEDOR':
        return 'Proveedor';
      default:
        return rol;
    }
  }
} 