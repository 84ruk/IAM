import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateUserDto,
    currentUserRol: Rol,
    currentUserEmpresaId: number,
  ) {
    // Validar permisos para crear usuarios
    if (currentUserRol === 'EMPLEADO') {
      throw new ForbiddenException('Los empleados no pueden crear usuarios');
    }

    if (currentUserRol === 'ADMIN' && data.rol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden crear superadministradores',
      );
    }

    // Verificar que el email no esté en uso
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    // Hash de la contraseña si se proporciona
    let hashedPassword: string | null = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Determinar la empresa del usuario
    const userEmpresaId = data.empresaId
      ? Number(data.empresaId)
      : currentUserEmpresaId;

    // Si es ADMIN, solo puede crear usuarios en su empresa
    if (currentUserRol === 'ADMIN' && userEmpresaId !== currentUserEmpresaId) {
      throw new ForbiddenException(
        'Los administradores solo pueden crear usuarios en su empresa',
      );
    }

    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        rol: data.rol,
        empresaId: userEmpresaId,
        googleId: (data as any).googleId,
        authProvider: (data as any).authProvider || 'local',
        setupCompletado: false,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        setupCompletado: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async findAll(
    query: QueryUsersDto,
    currentUserRol: Rol,
    currentUserEmpresaId: number,
  ) {
    const {
      search,
      rol,
      activo,
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Filtro por empresa (excepto para SUPERADMIN)
    if (currentUserRol !== 'SUPERADMIN') {
      where.empresaId = currentUserEmpresaId;
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por rol
    if (rol) {
      where.rol = rol;
    }

    // Filtro por estado activo
    if (activo !== undefined) {
      where.activo = activo;
    }

    // Obtener usuarios con paginación
    const [users, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          createdAt: true,
          setupCompletado: true,
          authProvider: true,
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUserRol: Rol, currentUserEmpresaId: number) {
    // Construir filtro de empresa
    const where: any = { id };
    if (currentUserRol !== 'SUPERADMIN') {
      where.empresaId = currentUserEmpresaId;
    }

    const user = await this.prisma.usuario.findFirst({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        setupCompletado: true,
        authProvider: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserRol: Rol,
    currentUserEmpresaId: number,
  ) {
    // Verificar que el usuario existe y tiene permisos para editarlo
    const existingUser = await this.prisma.usuario.findFirst({
      where:
        currentUserRol === 'SUPERADMIN'
          ? { id }
          : { id, empresaId: currentUserEmpresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos para cambiar roles
    if (updateUserDto.rol) {
      if (currentUserRol === 'ADMIN' && updateUserDto.rol === 'SUPERADMIN') {
        throw new ForbiddenException(
          'Los administradores no pueden asignar rol de superadministrador',
        );
      }

      if (currentUserRol === 'ADMIN' && existingUser.rol === 'SUPERADMIN') {
        throw new ForbiddenException(
          'Los administradores no pueden modificar superadministradores',
        );
      }

      if (currentUserRol === 'EMPLEADO') {
        throw new ForbiddenException('Los empleados no pueden cambiar roles');
      }
    }

    // Verificar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.usuario.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new BadRequestException('Ya existe un usuario con ese email');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (updateUserDto.nombre) updateData.nombre = updateUserDto.nombre;
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.rol) updateData.rol = updateUserDto.rol;
    if (updateUserDto.activo !== undefined)
      updateData.activo = updateUserDto.activo;

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        setupCompletado: true,
        authProvider: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return updatedUser;
  }

  async remove(id: number, currentUserRol: Rol, currentUserEmpresaId: number) {
    // Verificar que el usuario existe y tiene permisos para eliminarlo
    const existingUser = await this.prisma.usuario.findFirst({
      where:
        currentUserRol === 'SUPERADMIN'
          ? { id }
          : { id, empresaId: currentUserEmpresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos para eliminar
    if (currentUserRol === 'EMPLEADO') {
      throw new ForbiddenException('Los empleados no pueden eliminar usuarios');
    }

    if (currentUserRol === 'ADMIN' && existingUser.rol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden eliminar superadministradores',
      );
    }

    // No permitir que un usuario se elimine a sí mismo
    if (existingUser.id === id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }

    // Soft delete - marcar como inactivo en lugar de eliminar
    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Usuario desactivado exitosamente' };
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async getUsersByEmpresa(empresaId: number) {
    return this.prisma.usuario.findMany({
      where: { empresaId, activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
        setupCompletado: true,
      },
    });
  }

  async getUsersStats(currentUserRol: Rol, currentUserEmpresaId: number) {
    const where: any = {};
    if (currentUserRol !== 'SUPERADMIN') {
      where.empresaId = currentUserEmpresaId;
    }

    const [total, activos, inactivos] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.count({ where: { ...where, activo: true } }),
      this.prisma.usuario.count({ where: { ...where, activo: false } }),
    ]);

    const roles = await this.prisma.usuario.groupBy({
      by: ['rol'],
      where,
      _count: { rol: true },
    });

    return {
      total,
      activos,
      inactivos,
      roles: roles.map((r) => ({ rol: r.rol, count: r._count.rol })),
    };
  }
}
