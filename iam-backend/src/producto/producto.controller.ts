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
  ValidationPipe
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
  async findAll(@CurrentUser() user: JwtUser) {
    return this.productoService.findAll(user.empresaId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.findOne(id, user.empresaId);
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

  @Delete(':id')
  @Roles(Rol.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser
  ) {
    return this.productoService.remove(id, user.empresaId);
  }
}
