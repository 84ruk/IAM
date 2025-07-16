import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { Rol } from '@prisma/client';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard) // Agregar UnifiedEmpresaGuard para validación inteligente
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.usersService.create(
      createUserDto,
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  async findAll(
    @Query() query: QueryUsersDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.usersService.findAll(
      query,
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  @Get('stats')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  async getStats(@CurrentUser() currentUser: JwtUser) {
    return this.usersService.getUsersStats(
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  @Get('empresa/:empresaId')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  async getUsersByEmpresa(
    @Param('empresaId') empresaId: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    // Verificar permisos
    if (
      currentUser.rol !== 'SUPERADMIN' &&
      currentUser.empresaId !== Number(empresaId)
    ) {
      throw new Error('No tienes permisos para ver usuarios de esta empresa');
    }

    return this.usersService.getUsersByEmpresa(Number(empresaId));
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) {
    return this.usersService.findOne(
      Number(id),
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.usersService.update(
      Number(id),
      updateUserDto,
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) {
    return this.usersService.remove(
      Number(id),
      currentUser.rol,
      currentUser.empresaId || 0,
    );
  }

  // Endpoint para registro público (sin autenticación)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    // Para registro público, usar rol ADMIN y sin empresa
    return this.usersService.create(createUserDto, 'SUPERADMIN' as Rol, 0);
  }
}
