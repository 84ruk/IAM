import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { Rol } from '@prisma/client';
import { SecurityValidator } from '../../common/services/security-validator.service';

@Injectable()
export class RoleManagementService {
  constructor(
    private prisma: PrismaService,
    private securityValidator: SecurityValidator,
  ) {}

  async changeRole(
    id: number,
    dto: ChangeRoleDto,
    empresaId: number,
    currentUserRol: Rol,
  ) {
    // Verificar que el usuario existe y tiene permisos para editarlo
    const existingUser = await this.prisma.usuario.findFirst({
      where: currentUserRol === 'SUPERADMIN' ? { id } : { id, empresaId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar permisos de modificación
    this.securityValidator.validateUserModificationPermissions(
      { id: 0, email: '', rol: currentUserRol, empresaId } as any,
      existingUser.id,
      existingUser.empresaId || undefined,
    );

    // Validar que el nuevo rol sea válido
    if (currentUserRol === 'ADMIN' && dto.rol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden asignar rol de superadministrador',
      );
    }

    if (currentUserRol === 'ADMIN' && existingUser.rol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden modificar superadministradores',
      );
    }

    // Sanitizar input
    const sanitizedDto = this.securityValidator.validateAndSanitizeDto(dto, [
      'rol',
    ]);

    return this.prisma.usuario.update({
      where: { id },
      data: { rol: sanitizedDto.rol },
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
    return [
      { value: 'ADMIN', label: 'Administrador' },
      { value: 'SUPERADMIN', label: 'Super Administrador' },
      { value: 'EMPLEADO', label: 'Empleado' },
      { value: 'PROVEEDOR', label: 'Proveedor' },
    ];
  }

  async getRoleLabel(rol: Rol): Promise<string> {
    const roles = await this.getRoles();
    const roleInfo = roles.find((r) => r.value === rol);
    return roleInfo ? roleInfo.label : rol;
  }

  async validateRoleChange(
    currentUserRol: Rol,
    targetUserRol: Rol,
    newRol: Rol,
  ): Promise<boolean> {
    // SUPERADMIN puede cambiar cualquier rol
    if (currentUserRol === 'SUPERADMIN') {
      return true;
    }

    // ADMIN no puede modificar SUPERADMIN
    if (currentUserRol === 'ADMIN' && targetUserRol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden modificar superadministradores',
      );
    }

    // ADMIN no puede asignar rol SUPERADMIN
    if (currentUserRol === 'ADMIN' && newRol === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Los administradores no pueden asignar rol de superadministrador',
      );
    }

    // EMPLEADO no puede cambiar roles
    if (currentUserRol === 'EMPLEADO') {
      throw new ForbiddenException('Los empleados no pueden cambiar roles');
    }

    return true;
  }

  async getUsersByRole(role: Rol, empresaId: number, currentUserRol: Rol) {
    const where =
      currentUserRol === 'SUPERADMIN'
        ? { rol: role, activo: true }
        : { rol: role, empresaId, activo: true };

    return this.prisma.usuario.findMany({
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRoleStatistics(empresaId: number, currentUserRol: Rol) {
    const where =
      currentUserRol === 'SUPERADMIN'
        ? { activo: true }
        : { empresaId, activo: true };

    const users = await this.prisma.usuario.findMany({
      where,
      select: {
        rol: true,
      },
    });

    const statistics = {
      ADMIN: 0,
      SUPERADMIN: 0,
      EMPLEADO: 0,
      PROVEEDOR: 0,
    };

    users.forEach((user) => {
      statistics[user.rol]++;
    });

    return statistics;
  }
}
