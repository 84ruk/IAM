import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  controllers: [SuperAdminController],
  providers: [
    SuperAdminService,
    AuditService,
    AuditInterceptor,
    PrismaService,
    SuperAdminGuard,
  ],
  exports: [SuperAdminService, AuditService],
})
export class SuperAdminModule {}
