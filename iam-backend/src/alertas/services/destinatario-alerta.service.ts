import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestinatarioAlertaDto } from '../dto/create-destinatario-alerta.dto';
import { UpdateDestinatarioAlertaDto } from '../dto/update-destinatario-alerta.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class DestinatarioAlertaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDestinatarioAlertaDto, rol: Rol, empresaId: number) {
    if (!empresaId) throw new ForbiddenException('No tienes empresa asociada');
    // Validar unicidad de email por empresa
    const existe = await this.prisma.destinatarioAlerta.findFirst({
      where: { email: dto.email, empresaId },
    });
    if (existe) {
      throw new BadRequestException('Ya existe un destinatario con ese email en la empresa');
    }
    return this.prisma.destinatarioAlerta.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        telefono: dto.telefono,
        tipo: dto.tipo,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async findAll(rol: Rol, empresaId: number) {
    if (!empresaId) throw new ForbiddenException('No tienes empresa asociada');
    return this.prisma.destinatarioAlerta.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async update(id: number, dto: UpdateDestinatarioAlertaDto, rol: Rol, empresaId: number) {
    if (!empresaId) throw new ForbiddenException('No tienes empresa asociada');
    const destinatario = await this.prisma.destinatarioAlerta.findUnique({ where: { id } });
    if (!destinatario || destinatario.empresaId !== empresaId) {
      throw new NotFoundException('Destinatario no encontrado o no pertenece a tu empresa');
    }
    // Si se actualiza el email, validar unicidad
    if (dto.email && dto.email !== destinatario.email) {
      const existe = await this.prisma.destinatarioAlerta.findFirst({
        where: { email: dto.email, empresaId, NOT: { id } },
      });
      if (existe) {
        throw new BadRequestException('Ya existe un destinatario con ese email en la empresa');
      }
    }
    return this.prisma.destinatarioAlerta.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, rol: Rol, empresaId: number) {
    if (!empresaId) throw new ForbiddenException('No tienes empresa asociada');
    const destinatario = await this.prisma.destinatarioAlerta.findUnique({ where: { id } });
    if (!destinatario || destinatario.empresaId !== empresaId) {
      throw new NotFoundException('Destinatario no encontrado o no pertenece a tu empresa');
    }
    return this.prisma.destinatarioAlerta.delete({ where: { id } });
  }
}
