import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtAuditService } from './jwt-audit.service';
import { EmpresaRequiredGuard } from './guards/empresa-required.guard';
import { EmpresaSetupGuard } from './guards/empresa-setup.guard';
import { EmpresaGuard } from './guards/empresa.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { EmpresaCacheService } from './empresa-cache.service';
import { AppLoggerService } from '../common/services/logger.service';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Usar forwardRef para evitar dependencia circular
    PrismaModule,
    PassportModule,
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 10, // 10 requests por minuto
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { 
        expiresIn: '1d',
        issuer: process.env.JWT_ISSUER || 'http://localhost:3001',
        audience: process.env.JWT_AUDIENCE || 'http://localhost:3001',
      },
      verifyOptions: {
        issuer: process.env.JWT_ISSUER || 'http://localhost:3001',
        audience: process.env.JWT_AUDIENCE || 'http://localhost:3001',
        clockTolerance: 30, // 30 segundos de tolerancia para sincronización de reloj
      },
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    GoogleStrategy, 
    JwtAuditService, 
    EmpresaRequiredGuard, 
    EmpresaSetupGuard, 
    EmpresaGuard, // Guard consolidado que reemplaza SmartEmpresaGuard
    EmpresaCacheService,
    AppLoggerService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService, 
    JwtAuditService, 
    EmpresaRequiredGuard, 
    EmpresaSetupGuard, 
    EmpresaGuard, // Exportar el guard consolidado
    EmpresaCacheService,
    AppLoggerService,
  ],
})
export class AuthModule {}
