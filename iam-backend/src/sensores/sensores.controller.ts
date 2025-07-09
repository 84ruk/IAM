import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmpresaRequiredGuard } from 'src/auth/guards/empresa-required.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard, EmpresaRequiredGuard)
@EmpresaRequired()
@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post('lectura')
  recibirLectura(@Body() dto: CreateSensorLecturaDto) {
    return this.sensoresService.registrarLectura(dto);
  }
}
