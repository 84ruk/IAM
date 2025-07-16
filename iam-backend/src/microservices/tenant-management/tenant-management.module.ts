import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { EmpresaModule } from '../../empresa/empresa.module';
import { TenantManagementController } from './tenant-management.controller';
import { TenantManagementService } from './tenant-management.service';
import { TenantEventBus } from './tenant-event-bus.service';

@Module({
  imports: [AuthModule, UsersModule, EmpresaModule],
  controllers: [TenantManagementController],
  providers: [TenantManagementService, TenantEventBus],
  exports: [TenantManagementService, TenantEventBus],
})
export class TenantManagementModule {} 