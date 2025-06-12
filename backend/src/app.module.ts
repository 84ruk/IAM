import { Module } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, UsersModule, EmpresaModule, ProductoModule, MovimientoModule, InventarioModule, PedidoModule, ProveedorModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
