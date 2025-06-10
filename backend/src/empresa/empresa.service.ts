import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateEmpresaDto) {
    return this.prisma.empresa.create({ data });
  }

  findAll() {
    return this.prisma.empresa.findMany();
  }

  findOne(id: number) {
    return this.prisma.empresa.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateEmpresaDto) {
    const empresa = await this.findOne(id);
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.prisma.empresa.update({ where: { id }, data });
  }

  async remove(id: number) {
    const empresa = await this.findOne(id);
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.prisma.empresa.delete({ where: { id } });
  }
}
