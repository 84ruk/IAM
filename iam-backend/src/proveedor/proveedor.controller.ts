import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Patch, ParseIntPipe, Request } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { Rol } from '@prisma/client';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@Controller('proveedores')
@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async crear(@Body() dto: CrearProveedorDto, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.crear(dto, user.empresaId!);
  }

  @Get()
  async findAll(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.obtenerTodos(user.empresaId!);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.obtenerUno(id, user.empresaId!);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProveedorDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.actualizar(id, dto, user.empresaId!);
  }

  @Patch(':id/desactivar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async desactivar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.desactivar(id, user.empresaId!);
  }

  @Patch(':id/reactivar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async reactivar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.reactivar(id, user.empresaId!);
  }

  @Delete(':id/soft')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async softDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.softDelete(id, user.empresaId!, user.rol);
  }

  @Patch(':id/restaurar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async restaurar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.restaurar(id, user.empresaId!, user.rol);
  }

  @Delete(':id')
  @Roles(Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async eliminar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.proveedorService.eliminar(id, user.empresaId!, user.rol);
  }
}
