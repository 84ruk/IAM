import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';



@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}
 
  //PROBAR
  @Post()
  @Roles(Rol.ADMIN)
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresaService.create(dto);
  }

  @Get()
  findAll() {
    return this.empresaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmpresaDto) {
    return this.empresaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.remove(id);
  }

  
}
