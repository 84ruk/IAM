import { Controller, Post, Body } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';

@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post('lectura')
  recibirLectura(@Body() dto: CreateSensorLecturaDto) {
    return this.sensoresService.registrarLectura(dto);
  }
}
