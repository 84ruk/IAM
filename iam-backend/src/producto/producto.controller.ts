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
  Query,
  Request,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from 'src/auth/guards/unified-empresa.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { Rol } from '@prisma/client';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SUPERADMIN) // Solo ADMIN puede crear productos
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() dto: CreateProductoDto, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.create(dto, user.empresaId);
  }

  @Get()
  getAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('etiqueta') etiqueta?: string,
    @Query('estado') estado?: string,
    @Query('tipoProducto') tipoProducto?: string,
    @Query('agotados') agotados?: string,
    @Query('proveedorId') proveedorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    // Filtros específicos por industria
    @Query('temperaturaMin') temperaturaMin?: string,
    @Query('temperaturaMax') temperaturaMax?: string,
    @Query('humedadMin') humedadMin?: string,
    @Query('humedadMax') humedadMax?: string,
    @Query('talla') talla?: string,
    @Query('color') color?: string,
    @Query('sku') sku?: string,
    @Query('codigoBarras') codigoBarras?: string,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findAll(user.empresaId, {
      search,
      etiqueta,
      estado,
      tipoProducto,
      agotados: agotados === 'true',
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      // Filtros específicos por industria
      temperaturaMin: temperaturaMin ? parseFloat(temperaturaMin) : undefined,
      temperaturaMax: temperaturaMax ? parseFloat(temperaturaMax) : undefined,
      humedadMin: humedadMin ? parseFloat(humedadMin) : undefined,
      humedadMax: humedadMax ? parseFloat(humedadMax) : undefined,
      talla,
      color,
      sku,
      codigoBarras,
    });
  }

  @Get('inactivos')
  getInactive(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findInactive(user.empresaId);
  }

  @Get('eliminados')
  getDeleted(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findDeleted(user.empresaId);
  }

  @Get('papelera')
  getTrash(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findTrash(user.empresaId);
  }

  @Get('sin-proveedor')
  getWithoutProvider(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findWithoutProvider(user.empresaId);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.findOne(id, user.empresaId);
  }

  @Get('buscar/:codigoBarras')
  buscarPorCodigoBarras(
    @Param('codigoBarras') codigoBarras: string,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.buscarPorCodigoBarras(
      codigoBarras,
      user.empresaId,
    );
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.update(id, dto, user.empresaId);
  }

  @Patch(':id/desactivar')
  async deactivate(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.deactivate(id, user.empresaId);
  }

  // Endpoint para "eliminar" - oculta del frontend
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.softDelete(id, user.empresaId);
  }

  // Endpoint para eliminar
  @Delete(':id/permanent')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @UseGuards(RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.remove(id, user.empresaId, user.rol);
  }

  @Patch(':id/reactivar')
  @Roles(Rol.ADMIN)
  @UseGuards(RolesGuard)
  async reactivate(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.reactivate(id, user.empresaId);
  }

  // Endpoint para restaurar un producto eliminado
  @Patch(':id/restaurar')
  @Roles(Rol.ADMIN)
  @UseGuards(RolesGuard)
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.productoService.restore(id, user.empresaId);
  }
}
