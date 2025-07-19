import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { IndustryKPIService } from './services/industry-kpi.service';
import { PredictionService } from './services/prediction.service';
import { AlertService } from './services/alert.service';
import { FinancialDataFilterService } from './services/financial-data-filter.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CommonModule, AuthModule], // Importar CommonModule para servicios de cache
  controllers: [DashboardController],
  providers: [
    DashboardService, 
    IndustryKPIService, 
    PredictionService, 
    AlertService,
    FinancialDataFilterService
  ],
  exports: [
    DashboardService, 
    IndustryKPIService, 
    PredictionService, 
    AlertService,
    FinancialDataFilterService
  ],
})
export class DashboardModule {}
