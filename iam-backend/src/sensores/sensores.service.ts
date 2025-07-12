import { Injectable } from '@nestjs/common';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';
import { PrismaService } from 'src/prisma/prisma.service';

//EDIDTAR
@Injectable()
export class SensoresService {
  constructor(private prisma: PrismaService) {}

  async registrarLectura(dto: CreateSensorLecturaDto) {
    const data: any = {
      tipo: dto.tipo,
      valor: dto.valor,
      unidad: dto.unidad
    };

    if (dto.productoId) {
      data.productoId = dto.productoId;
    }

    const lectura = await this.prisma.sensorLectura.create({ data });

    if (dto.tipo === 'PESO' && dto.productoId) {
      // lógica para actualizar inventario con base en el peso
    }

    return lectura;
  }
}
