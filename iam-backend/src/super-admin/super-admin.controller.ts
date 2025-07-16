import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { DashboardStatsQueryDto } from './dto/dashboard-stats.dto';
import { GetUsersQueryDto, BulkUserActionDto } from './dto/users.dto';
import { GetStatsQueryDto } from './dto/stats.dto';
import { GetAuditLogsQueryDto } from './dto/audit.dto';
import { SystemConfigDto, TestEmailDto } from './dto/config.dto';

@Controller('super-admin')
@UseGuards(SuperAdminGuard)
@UseInterceptors(AuditInterceptor)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ==================== DASHBOARD ====================
  @Get('dashboard-stats')
  async getDashboardStats(@Query() query: DashboardStatsQueryDto) {
    return this.superAdminService.getDashboardStats(query);
  }

  // ==================== USERS MANAGEMENT ====================
  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.superAdminService.getUsers(query);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.superAdminService.deleteUser(id);
  }

  @Put('users/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    await this.superAdminService.activateUser(id);
  }

  @Put('users/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    await this.superAdminService.deactivateUser(id);
  }

  @Put('users/bulk/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkActivateUsers(@Body() body: BulkUserActionDto) {
    await this.superAdminService.bulkActivateUsers(body.userIds);
  }

  @Put('users/bulk/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDeactivateUsers(@Body() body: BulkUserActionDto) {
    await this.superAdminService.bulkDeactivateUsers(body.userIds);
  }

  @Delete('users/bulk/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDeleteUsers(@Body() body: BulkUserActionDto) {
    await this.superAdminService.bulkDeleteUsers(body.userIds);
  }

  // ==================== EMPRESAS MANAGEMENT ====================
  @Get('empresas')
  async getEmpresas() {
    return this.superAdminService.getEmpresas();
  }

  @Get('empresas/:id/stats')
  async getEmpresaStats(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getEmpresaStats(id);
  }

  // ==================== ADVANCED STATS ====================
  @Get('stats')
  async getSystemStats(@Query() query: GetStatsQueryDto) {
    return this.superAdminService.getSystemStats(query);
  }

  // ==================== AUDIT LOGS ====================
  @Get('audit/logs')
  async getAuditLogs(@Query() query: GetAuditLogsQueryDto) {
    return this.superAdminService.getAuditLogs(query);
  }

  @Get('audit/stats')
  async getAuditStats(@Query('range') range: string) {
    return this.superAdminService.getAuditStats(range);
  }

  @Get('audit/export')
  async exportAuditLogs(@Query('range') range: string, @Res() res: Response) {
    // En producción, esto generaría un archivo CSV real
    const csvContent = `Fecha,Usuario,Acción,Recurso,Detalles,IP
${new Date().toISOString()},admin@test.com,LOGIN,AUTH,Inicio de sesión exitoso,192.168.1.1
${new Date().toISOString()},user@test.com,CREATE,USER,Usuario creado,192.168.1.2`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csvContent);
  }

  // ==================== CONFIGURATION ====================
  @Get('config')
  async getSystemConfig() {
    return this.superAdminService.getSystemConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSystemConfig(@Body() config: SystemConfigDto) {
    await this.superAdminService.updateSystemConfig(config);
  }

  @Post('config/test-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async testEmailConfig(@Body() testEmail: TestEmailDto) {
    await this.superAdminService.testEmailConfig(testEmail);
  }

  @Post('config/backup')
  @HttpCode(HttpStatus.NO_CONTENT)
  async backupNow() {
    await this.superAdminService.backupNow();
  }
}
