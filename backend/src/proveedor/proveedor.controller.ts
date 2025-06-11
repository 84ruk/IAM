import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  crear(@Body() dto: CrearProveedorDto, @Req() req: any) {
    const empresaId = req.user.empresaId;
    return this.proveedorService.crear(dto, empresaId);
  }

  @Get()
  obtenerTodos(@Req() req: any) {
    return this.proveedorService.obtenerTodos(req.user.empresaId);
  }

  @Get(':id')
  obtenerUno(@Param('id') id: string, @Req() req: any) {
    return this.proveedorService.obtenerUno(Number(id), req.user.empresaId);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProveedorDto, @Req() req: any) {
    return this.proveedorService.actualizar(Number(id), dto, req.user.empresaId);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.proveedorService.eliminar(Number(id), req.user.empresaId);
  }
}
