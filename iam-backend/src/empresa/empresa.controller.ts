import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';



@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}
 
  //PROBAR
  @Post()
  @Roles(Rol.SUPERADMIN)
  @EmpresaRequired() // Solo para superadmin que ya tiene empresa
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresaService.create(dto);
  }

  @Get()
  @EmpresaRequired()
  findAll() {
    return this.empresaService.findAll();
  }

  @Get(':id')
  @EmpresaRequired()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id')
  @EmpresaRequired()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmpresaDto) {
    return this.empresaService.update(id, dto);
  }

  @Delete(':id')
  @EmpresaRequired()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.remove(id);
  }

  
}
