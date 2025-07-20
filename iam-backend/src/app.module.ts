import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresaModule } from './empresa/empresa.module';
import { ProductoModule } from './producto/producto.module';
import { MovimientoModule } from './movimiento/movimiento.module';
import { InventarioModule } from './inventario/inventario.module';
import { PedidoModule } from './pedido/pedido.module';
import { ProveedorModule } from './proveedor/proveedor.module';
// 🎯 DASHBOARD MODULES - Orden crítico para evitar conflictos de routing
import { DashboardCQRSModule } from './dashboard/dashboard-cqrs.module'; // ✅ PRIORIDAD ALTA - Nuevo sistema CQRS
import { DashboardModule } from './dashboard/dashboard.module'; // ⚠️ PRIORIDAD BAJA - Sistema legacy (migración en progreso)
import { SensoresModule } from './sensores/sensores.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { NotificationModule } from './notifications/notification.module';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { DashboardLoggingMiddleware } from './common/middleware/dashboard-logging.middleware';
import { MqttSensorModule } from './microservices/mqtt-sensor/mqtt-sensor.module';
import mqttConfig from './config/mqtt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [mqttConfig],
    }),
    // 🔐 MÓDULOS DE AUTENTICACIÓN Y AUTORIZACIÓN
    AuthModule,
    UsersModule,
    
    // 🏢 MÓDULOS DE NEGOCIO PRINCIPALES
    EmpresaModule,
    ProductoModule,
    MovimientoModule,
    InventarioModule,
    PedidoModule,
    ProveedorModule,
    
    // 📊 MÓDULOS DE DASHBOARD - ORDEN CRÍTICO
    DashboardCQRSModule, // ✅ NUEVO SISTEMA CQRS (alta prioridad)
    DashboardModule,     // ⚠️ SISTEMA LEGACY (baja prioridad - en migración)
    
    // 🔧 MÓDULOS DE ADMINISTRACIÓN Y SERVICIOS
    SensoresModule,
    AdminModule,
    SuperAdminModule,
    NotificationModule,
    MqttSensorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JwtAuthGuard se ejecuta PRIMERO (autenticación)
    },
    // EmpresaGuard se usará a nivel de controlador/método para evitar problemas de orden
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 🎯 MIDDLEWARE DE LOGGING PARA DASHBOARD (específico para debugging)
      .apply(DashboardLoggingMiddleware)
      .forRoutes(
        { path: 'dashboard', method: RequestMethod.ALL },
        { path: 'dashboard-cqrs', method: RequestMethod.ALL },
        { path: 'dashboard/*', method: RequestMethod.ALL },
        { path: 'dashboard-cqrs/*', method: RequestMethod.ALL }
      )
      // 🔒 MIDDLEWARE DE SEGURIDAD (global)
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
