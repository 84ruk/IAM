import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Rol } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @Roles(Rol.ADMIN) // Solo ADMIN puede crear productos
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() dto: CreateProductoDto,
    @CurrentUser() user: JwtUser
  ) {
    const empresaId = user.empresaId;
    return this.productoService.create(dto, empresaId);
  }

  @Get()
  getAll(
    @CurrentUser() user: JwtUser,
    @Query('search') search?: string,
    @Query('etiqueta') etiqueta?: string,
    @Query('estado') estado?: string,
    @Query('tipoProducto') tipoProducto?: string,
    @Query('agotados') agotados?: string,
    @Query('proveedorId') proveedorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.productoService.findAll(user.empresaId, {
      search,
      etiqueta,
      estado,
      tipoProducto,
      agotados: agotados === 'true',
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });
  }

  @Get('inactivos')
  getInactive(@CurrentUser() user: JwtUser) {
    return this.productoService.findInactive(user.empresaId);
  }

  @Get('eliminados')
  getDeleted(@CurrentUser() user: JwtUser) {
    return this.productoService.findDeleted(user.empresaId);
  }

  @Get('sin-proveedor')
  getWithoutProvider(@CurrentUser() user: JwtUser) {
    return this.productoService.findWithoutProvider(user.empresaId);
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.findOne(id, user.empresaId);
  }

  @Get('buscar/:codigoBarras')
  buscarPorCodigoBarras(
    @Param('codigoBarras') codigoBarras: string,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.buscarPorCodigoBarras(codigoBarras, user.empresaId);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.update(id, dto, user.empresaId);
  }


  @Patch(':id/desactivar')
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.deactivate(id, user.empresaId);
  }

  // Endpoint para "eliminar" - oculta del frontend
  @Delete(':id')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.softDelete(id, user.empresaId);
  }

  // Endpoint para eliminar
  @Delete(':id/permanent')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.remove(id, user.empresaId, user.rol);
  }

  @Patch(':id/reactivar')
  @Roles(Rol.ADMIN)
  async reactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.reactivate(id, user.empresaId);
  }

  // Endpoint para restaurar un producto eliminado
  @Patch(':id/restaurar')
  @Roles(Rol.ADMIN)
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.restore(id, user.empresaId);
  }
}
