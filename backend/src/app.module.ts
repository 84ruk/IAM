import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresaModule } from './empresa/empresa.module';
import { ProductoModule } from './producto/producto.module';
import { MovimientoModule } from './movimiento/movimiento.module';
import { InventarioModule } from './inventario/inventario.module';

@Module({
  imports: [AuthModule, UsersModule, EmpresaModule, ProductoModule, MovimientoModule, InventarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
