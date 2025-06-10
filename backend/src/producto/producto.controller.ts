import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  async create(@Body() dto: CreateProductoDto, @Req() req: any) {
    const empresaId = req.user.empresaId; 
    return this.productoService.create(dto, empresaId);
  }

  @Get()
  findAll() {
    return this.productoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductoDto) {
    return this.productoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productoService.remove(id);
  }
}
