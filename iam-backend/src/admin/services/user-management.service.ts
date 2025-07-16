import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';
import { Rol } from '@prisma/client';
import { SecurityValidator } from '../../common/services/security-validator.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserManagementService {
  constructor(
    private prisma: PrismaService,
    private securityValidator: SecurityValidator,
  ) {}

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

    // Sanitizar y validar input
    const sanitizedDto = this.securityValidator.validateAndSanitizeDto(dto, [
      'nombre', 'email', 'password', 'rol', 'empresaId'
    ]);

    // Validar email
    this.securityValidator.validateEmail(sanitizedDto.email);

    // Validar contraseña si se proporciona
    if (sanitizedDto.password) {
      this.securityValidator.validatePasswordStrength(sanitizedDto.password);
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: sanitizedDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Hash de la contraseña
    const hashedPassword = sanitizedDto.password ? await bcrypt.hash(sanitizedDto.password, 10) : null;

    // Determinar la empresa del usuario
    const userEmpresaId = sanitizedDto.empresaId ? parseInt(sanitizedDto.empresaId.toString()) : empresaId;

    // Si es ADMIN, puede crear usuarios solo en su empresa
    if (currentUserRol === 'ADMIN' && userEmpresaId !== empresaId) {
      throw new ForbiddenException('Los administradores solo pueden crear usuarios en su empresa');
    }

    return this.prisma.usuario.create({
      data: {
        nombre: sanitizedDto.nombre,
        email: sanitizedDto.email,
        password: hashedPassword,
        rol: sanitizedDto.rol,
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

  private validateUserModificationOrThrow(
    currentUserRol: Rol,
    empresaId: number,
    usuario: { id: number, empresaId?: number | null }
  ) {
    this.securityValidator.validateUserModificationPermissions(
      { id: 0, email: '', rol: currentUserRol, empresaId } as any,
      usuario.id,
      usuario.empresaId || undefined
    );
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

    // Validar permisos de modificación
    this.validateUserModificationOrThrow(currentUserRol, empresaId, existingUser);

    // Sanitizar y validar input
    const sanitizedDto = this.securityValidator.validateAndSanitizeDto(dto, [
      'nombre', 'email', 'password', 'rol', 'empresaId'
    ]);

    // Validar email si se está actualizando
    if (sanitizedDto.email) {
      this.securityValidator.validateEmail(sanitizedDto.email);
    }

    // Validar contraseña si se está actualizando
    if (sanitizedDto.password) {
      this.securityValidator.validatePasswordStrength(sanitizedDto.password);
    }

    // Verificar email único si se está actualizando
    if (sanitizedDto.email && sanitizedDto.email !== existingUser.email) {
      const emailExists = await this.prisma.usuario.findUnique({
        where: { email: sanitizedDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (sanitizedDto.nombre) updateData.nombre = sanitizedDto.nombre;
    if (sanitizedDto.email) updateData.email = sanitizedDto.email;
    if (sanitizedDto.rol) updateData.rol = sanitizedDto.rol;
    
    if (sanitizedDto.password) {
      updateData.password = await bcrypt.hash(sanitizedDto.password, 10);
    }

    // Solo SUPERADMIN puede cambiar la empresa
    if (sanitizedDto.empresaId && currentUserRol === 'SUPERADMIN') {
      updateData.empresaId = parseInt(sanitizedDto.empresaId.toString());
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

  async activate(id: number, empresaId: number, currentUserRol: Rol) {
    const where = currentUserRol === 'SUPERADMIN' 
      ? { id } 
      : { id, empresaId };

    const usuario = await this.prisma.usuario.findFirst({
      where,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos de modificación
    this.validateUserModificationOrThrow(currentUserRol, empresaId, usuario);

    if (usuario.activo) {
      throw new ConflictException('El usuario ya está activo');
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
    const where = currentUserRol === 'SUPERADMIN' 
      ? { id } 
      : { id, empresaId };

    const usuario = await this.prisma.usuario.findFirst({
      where,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos de modificación
    this.validateUserModificationOrThrow(currentUserRol, empresaId, usuario);

    if (!usuario.activo) {
      throw new ConflictException('El usuario ya está inactivo');
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
    const where = currentUserRol === 'SUPERADMIN' 
      ? { id } 
      : { id, empresaId };

    const usuario = await this.prisma.usuario.findFirst({
      where,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos de modificación
    this.validateUserModificationOrThrow(currentUserRol, empresaId, usuario);

    return this.prisma.usuario.delete({
      where: { id },
    });
  }
} 