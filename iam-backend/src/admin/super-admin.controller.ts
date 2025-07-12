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
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { SuperAdminService } from './super-admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // Dashboard y estadísticas globales
  @Get('dashboard')
  async getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }

  // Gestión de usuarios global
  @Get('users')
  async findAllUsers(@Query() query: any) {
    return this.superAdminService.findAllUsers(query);
  }

  @Get('users/:id')
  async findOneUser(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.findOneUser(id);
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserAdminDto) {
    return this.superAdminService.createUser(createUserDto);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserAdminDto,
  ) {
    return this.superAdminService.updateUser(id, updateUserDto);
  }

  @Patch('users/:id/role')
  async changeUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.superAdminService.changeUserRole(id, changeRoleDto);
  }

  @Patch('users/:id/activate')
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.deactivateUser(id);
  }

  @Delete('users/:id')
  async removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.removeUser(id);
  }

  // Gestión de empresas
  @Get('empresas')
  async findAllEmpresas() {
    return this.superAdminService.findAllEmpresas();
  }

  @Get('empresas/:id')
  async findOneEmpresa(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.findOneEmpresa(id);
  }

  @Get('empresas/:id/users')
  async getEmpresaUsers(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getEmpresaUsers(id);
  }

  @Get('empresas/:id/stats')
  async getEmpresaStats(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getEmpresaStats(id);
  }

  // Auditoría y logs
  @Get('audit-logs')
  async getAuditLogs(@Query() query: any) {
    return this.superAdminService.getAuditLogs(query);
  }

  @Get('system-stats')
  async getSystemStats() {
    return this.superAdminService.getSystemStats();
  }

  // Configuración del sistema
  @Get('system-config')
  async getSystemConfig() {
    return this.superAdminService.getSystemConfig();
  }

  @Put('system-config')
  async updateSystemConfig(@Body() config: any) {
    return this.superAdminService.updateSystemConfig(config);
  }

  @Post('init-super-admin')
  @UseGuards(JwtAuthGuard)
  async createInitialSuperAdmin(@CurrentUser() user: JwtUser) {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Este endpoint no está disponible en producción');
    }
    
    return this.superAdminService.createInitialSuperAdmin();
  }
} 