import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, ErrorHandlerService],
  exports: [DashboardService]
})
export class DashboardModule {}
