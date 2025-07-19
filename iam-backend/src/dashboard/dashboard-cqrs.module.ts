import { Module } from '@nestjs/common';
import { DashboardCQRSController } from './dashboard-cqrs.controller';
import { DashboardCQRSService } from './dashboard-cqrs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

// Handlers
import { GetKpisHandler } from './handlers/get-kpis.handler';
import { GetFinancialKpisHandler } from './handlers/get-financial-kpis.handler';
import { GetIndustryKpisHandler } from './handlers/get-industry-kpis.handler';
import { GetPredictiveKpisHandler } from './handlers/get-predictive-kpis.handler';

// Servicios auxiliares (mantener compatibilidad)
import { IndustryKPIService } from './services/industry-kpi.service';
import { PredictionService } from './services/prediction.service';
import { AlertService } from './services/alert.service';
import { FinancialDataFilterService } from './services/financial-data-filter.service';

@Module({
  imports: [PrismaModule, CommonModule, AuthModule],
  controllers: [DashboardCQRSController],
  providers: [
    // Servicio principal CQRS
    DashboardCQRSService,
    
    // Handlers CQRS
    GetKpisHandler,
    GetFinancialKpisHandler,
    GetIndustryKpisHandler,
    GetPredictiveKpisHandler,
    
    // Servicios auxiliares (para compatibilidad)
    IndustryKPIService,
    PredictionService,
    AlertService,
    FinancialDataFilterService,
  ],
  exports: [
    DashboardCQRSService,
    GetKpisHandler,
    GetFinancialKpisHandler,
    GetIndustryKpisHandler,
    GetPredictiveKpisHandler,
    IndustryKPIService,
    PredictionService,
    AlertService,
    FinancialDataFilterService,
  ],
})
export class DashboardCQRSModule {} 