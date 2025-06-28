import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(empresaId: number, currentUserRol: Rol) {
    // SUPERADMIN puede ver todos los usuarios de todas las empresas
    // ADMIN solo puede ver usuarios de su empresa
    const where = currentUserRol === 'SUPERADMIN' 
      ? {} 
      : { empresaId };

    return this.prisma.usuario.findMany({
      where: {
        ...where,
        activo: true, // Solo usuarios activos
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, empresaId: number, currentUserRol: Rol) {
    const where = currentUserRol === 'SUPERADMIN' 
      ? { id } 
      : { id, empresaId };

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        ...where,
        activo: true,
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
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async create(dto: CreateUserAdminDto, empresaId: number, currentUserRol: Rol) {
    // Validar permisos para crear usuarios
    if (currentUserRol === 'ADMIN' && dto.rol === 'SUPERADMIN') {
      throw new ForbiddenException('Los administradores no pueden crear superadministradores');
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Determinar la empresa del usuario
    const userEmpresaId = dto.empresaId ? parseInt(dto.empresaId) : empresaId;

    // Si es SUPERADMIN, puede crear usuarios para cualquier empresa
    if (currentUserRol === 'ADMIN' && userEmpresaId !== empresaId) {
      throw new ForbiddenException('Los administradores solo pueden crear usuarios en su empresa');
    }

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol,
        empresaId: userEmpresaId,
        activo: true,
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
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateUserAdminDto, empresaId: number, currentUserRol: Rol) {
    // Verificar que el usuario existe y tiene permisos para editarlo
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' 
        ? { id } 
        : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos para cambiar roles
    if (dto.rol) {
      if (currentUserRol === 'ADMIN' && dto.rol === 'SUPERADMIN') {
        throw new ForbiddenException('Los administradores no pueden asignar rol de superadministrador');
      }

      if (currentUserRol === 'ADMIN' && existingUser.rol === 'SUPERADMIN') {
        throw new ForbiddenException('Los administradores no pueden modificar superadministradores');
      }
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

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.email) updateData.email = dto.email;
    if (dto.rol) updateData.rol = dto.rol;
    
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    // Solo SUPERADMIN puede cambiar la empresa
    if (dto.empresaId && currentUserRol === 'SUPERADMIN') {
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
          },
        },
      },
    });
  }

  async changeRole(id: number, dto: ChangeRoleDto, empresaId: number, currentUserRol: Rol) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' 
        ? { id } 
        : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos para cambiar roles
    if (currentUserRol === 'ADMIN') {
      if (dto.rol === 'SUPERADMIN') {
        throw new ForbiddenException('Los administradores no pueden asignar rol de superadministrador');
      }

      if (existingUser.rol === 'SUPERADMIN') {
        throw new ForbiddenException('Los administradores no pueden modificar superadministradores');
      }
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
          },
        },
      },
    });
  }

  async activate(id: number, empresaId: number, currentUserRol: Rol) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' 
        ? { id } 
        : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (existingUser.activo) {
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
          },
        },
      },
    });
  }

  async deactivate(id: number, empresaId: number, currentUserRol: Rol) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' 
        ? { id } 
        : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!existingUser.activo) {
      throw new BadRequestException('El usuario ya está inactivo');
    }

    // No permitir desactivar superadministradores
    if (existingUser.rol === 'SUPERADMIN' && currentUserRol === 'ADMIN') {
      throw new ForbiddenException('Los administradores no pueden desactivar superadministradores');
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
          },
        },
      },
    });
  }

  async remove(id: number, empresaId: number, currentUserRol: Rol) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' 
        ? { id } 
        : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // No permitir eliminar superadministradores
    if (existingUser.rol === 'SUPERADMIN' && currentUserRol === 'ADMIN') {
      throw new ForbiddenException('Los administradores no pueden eliminar superadministradores');
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
          },
        },
      },
    });
  }

  async getRoles() {
    return Object.values(Rol).map(rol => ({
      value: rol,
      label: this.getRoleLabel(rol),
    }));
  }

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