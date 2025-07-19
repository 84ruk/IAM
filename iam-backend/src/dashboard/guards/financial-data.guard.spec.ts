import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FinancialDataGuard } from './financial-data.guard';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { Rol } from '@prisma/client';
import { AppLoggerService } from '../../common/services/logger.service';

describe('FinancialDataGuard', () => {
  let guard: FinancialDataGuard;
  let reflector: Reflector;
  let logger: AppLoggerService;

  const mockExecutionContext = (user: JwtUser | null, requiresFinancialAccess = true) => {
    const mockRequest = {
      user,
      url: '/dashboard/financial-kpis',
      method: 'GET',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialDataGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(requiresFinancialAccess),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            security: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<FinancialDataGuard>(FinancialDataGuard);
    reflector = module.get<Reflector>(Reflector);
    logger = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should deny access when user is not authenticated', () => {
      const context = mockExecutionContext(null);
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Usuario no autenticado');
    });

    it('should allow access when financial access is not required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const user: JwtUser = {
        id: 1,
        email: 'test@example.com',
        rol: 'EMPLEADO' as Rol,
        empresaId: 1,
      };
      const context = mockExecutionContext(user, false);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow full access for SUPERADMIN', () => {
      const user: JwtUser = {
        id: 1,
        email: 'admin@example.com',
        rol: 'SUPERADMIN' as Rol,
        empresaId: 1,
      };
      const context = mockExecutionContext(user);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow full access for ADMIN', () => {
      const user: JwtUser = {
        id: 1,
        email: 'admin@example.com',
        rol: 'ADMIN' as Rol,
        empresaId: 1,
      };
      const context = mockExecutionContext(user);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow limited access for EMPLEADO', () => {
      const user: JwtUser = {
        id: 1,
        email: 'empleado@example.com',
        rol: 'EMPLEADO' as Rol,
        empresaId: 1,
      };
      const context = mockExecutionContext(user);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access for PROVEEDOR', () => {
      const user: JwtUser = {
        id: 1,
        email: 'proveedor@example.com',
        rol: 'PROVEEDOR' as Rol,
        empresaId: 1,
      };
      const context = mockExecutionContext(user);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para acceder a datos financieros');
    });

    it('should set financial access level on request for ADMIN', () => {
      const user: JwtUser = {
        id: 1,
        email: 'admin@example.com',
        rol: 'ADMIN' as Rol,
        empresaId: 1,
      };
      const mockRequest = {
        user,
        url: '/dashboard/financial-kpis',
        method: 'GET',
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      guard.canActivate(context);
      
      expect(mockRequest.financialAccessLevel).toBe('full');
      expect(mockRequest.userRole).toBe('ADMIN');
    });

    it('should set financial access level on request for EMPLEADO', () => {
      const user: JwtUser = {
        id: 1,
        email: 'empleado@example.com',
        rol: 'EMPLEADO' as Rol,
        empresaId: 1,
      };
      const mockRequest = {
        user,
        url: '/dashboard/financial-kpis',
        method: 'GET',
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      guard.canActivate(context);
      
      expect(mockRequest.financialAccessLevel).toBe('limited');
      expect(mockRequest.userRole).toBe('EMPLEADO');
    });
  });
}); 