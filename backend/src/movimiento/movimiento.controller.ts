import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly service: MovimientoService) {}

  @Post()
  create(@Body() dto: CreateMovimientoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
