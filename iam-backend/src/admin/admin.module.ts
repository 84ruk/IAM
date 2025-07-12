import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule para acceso a EmpresaGuard

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, SuperAdminController],
  providers: [AdminService, SuperAdminService],
})
export class AdminModule {} 