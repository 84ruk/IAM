import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { DashboardModule } from './dashboard/dashboard.module';
import { SensoresModule } from './sensores/sensores.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SecurityMiddleware } from './common/middleware/security.middleware';

@Module({
  imports: [
    AuthModule, 
    UsersModule, 
    EmpresaModule, 
    ProductoModule, 
    MovimientoModule, 
    InventarioModule, 
    PedidoModule, 
    ProveedorModule, 
    DashboardModule, 
    SensoresModule, 
    AdminModule,
    SuperAdminModule
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
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
