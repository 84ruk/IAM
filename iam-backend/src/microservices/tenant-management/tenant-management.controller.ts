import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantManagementService } from './tenant-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('tenant-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantManagementController {
  constructor(private readonly tenantService: TenantManagementService) {}

  @Get('tenants')
  @Roles(Rol.SUPERADMIN)
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get('tenants/:id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getTenant(@Param('id') id: string) {
    return this.tenantService.getTenant(parseInt(id));
  }

  @Post('tenants')
  @Roles(Rol.SUPERADMIN)
  async createTenant(@Body() createTenantDto: any) {
    return this.tenantService.createTenant(createTenantDto);
  }

  @Put('tenants/:id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async updateTenant(@Param('id') id: string, @Body() updateTenantDto: any) {
    return this.tenantService.updateTenant(parseInt(id), updateTenantDto);
  }

  @Delete('tenants/:id')
  @Roles(Rol.SUPERADMIN)
  async deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(parseInt(id));
  }

  @Get('tenants/:id/users')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getTenantUsers(@Param('id') id: string) {
    return this.tenantService.getTenantUsers(parseInt(id));
  }

  @Post('tenants/:id/users')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async addUserToTenant(@Param('id') id: string, @Body() userData: any) {
    return this.tenantService.addUserToTenant(parseInt(id), userData);
  }

  @Delete('tenants/:id/users/:userId')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async removeUserFromTenant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantService.removeUserFromTenant(parseInt(id), parseInt(userId));
  }

  @Get('tenants/:id/analytics')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getTenantAnalytics(@Param('id') id: string) {
    return this.tenantService.getTenantAnalytics(parseInt(id));
  }
} 