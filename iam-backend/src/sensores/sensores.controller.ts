import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post('lectura')
  recibirLectura(@Body() dto: CreateSensorLecturaDto) {
    return this.sensoresService.registrarLectura(dto);
  }
}
