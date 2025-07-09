import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule para acceso a EmpresaGuard

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)], // Usar forwardRef para evitar dependencia circular
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
