import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, UnifiedEmpresaGuard) // Agregar UnifiedEmpresaGuard para validación inteligente
@EmpresaRequired()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAll(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.findAll(user.empresaId!, user.rol);
  }

  @Get('users/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.findOne(id, user.empresaId!, user.rol);
  }

  @Post('users')
  async create(
    @Body() createUserDto: CreateUserAdminDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.create(createUserDto, user.empresaId!, user.rol);
  }

  @Put('users/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserAdminDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.update(id, updateUserDto, user.empresaId!, user.rol);
  }

  @Patch('users/:id/role')
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeRoleDto: ChangeRoleDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.changeRole(id, changeRoleDto, user.empresaId!, user.rol);
  }

  @Patch('users/:id/activate')
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.activate(id, user.empresaId!, user.rol);
  }

  @Patch('users/:id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.deactivate(id, user.empresaId!, user.rol);
  }

  @Delete('users/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.adminService.remove(id, user.empresaId!, user.rol);
  }

  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }
} 