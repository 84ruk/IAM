import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; 
import { NotificationModule } from '../notifications/notification.module'; 
@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => AuthModule), // Usar forwardRef para evitar dependencia circular
    NotificationModule, // Importar NotificationModule para NotificationService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
