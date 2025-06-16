import { Injectable } from '@nestjs/common';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class SensoresService {
  constructor(private prisma: PrismaService) {}

  async registrarLectura(dto: CreateSensorLecturaDto) {
    const lectura = await this.prisma.sensorLectura.create({ data: dto });

    if (dto.tipo === 'PESO' && dto.productoId) {
      // lógica para actualizar inventario con base en el peso
    }

    return lectura;
  }
}
