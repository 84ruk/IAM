import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Patch, ParseIntPipe } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmpresaRequiredGuard } from 'src/auth/guards/empresa-required.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, EmpresaRequiredGuard)
@EmpresaRequired()
@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  crear(@Body() dto: CrearProveedorDto, @CurrentUser() user: JwtUser) {
    return this.proveedorService.crear(dto, user.empresaId);
  }

  @Get()
  obtenerTodos(@CurrentUser() user: JwtUser) {
    return this.proveedorService.obtenerTodos(user.empresaId);
  }

  @Get('inactivos')
  obtenerInactivos(@CurrentUser() user: JwtUser) {
    return this.proveedorService.obtenerInactivos(user.empresaId);
  }

  @Get('eliminados')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  obtenerEliminados(@CurrentUser() user: JwtUser) {
    return this.proveedorService.obtenerEliminados(user.empresaId);
  }

  @Get(':id')
  obtenerUno(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.obtenerUno(id, user.empresaId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarProveedorDto, @CurrentUser() user: JwtUser) {
    return this.proveedorService.actualizar(id, dto, user.empresaId);
  }

  @Patch(':id/desactivar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  desactivar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.desactivar(id, user.empresaId);
  }

  @Patch(':id/reactivar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  reactivar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.reactivar(id, user.empresaId);
  }

  // Endpoint para "eliminar" - soft delete
  @Delete(':id')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  softDelete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.softDelete(id, user.empresaId, user.rol);
  }

  // Endpoint para restaurar un proveedor eliminado
  @Patch(':id/restaurar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  restaurar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.restaurar(id, user.empresaId, user.rol);
  }

  // Endpoint para eliminar permanentemente
  @Delete(':id/permanent')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.proveedorService.eliminar(id, user.empresaId, user.rol);
  }
}
