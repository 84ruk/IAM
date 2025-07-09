import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { SetupEmpresaDto } from './dto/setup-empresa.dto';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuditService } from './jwt-audit.service';

interface JwtUserPayload {
  id: number;
  email: string;
  rol: string;
  empresaId?: number;
  tipoIndustria?: string; 
} 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // No revelar si el usuario existe o no (seguridad)
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.password) {
      throw new UnauthorizedException('Este usuario solo puede iniciar sesión con Google');
    }

    const passwordValid = await bcrypt.compare(password, user.password as string);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(user: JwtUserPayload) {

    if (!user) {
      throw new NotFoundException('El correo proporcionado no está registrado');
    }
    if (!user.rol) {
      throw new BadRequestException('El usuario no tiene un rol asignado');
    }

    let tipoIndustria = 'GENERICA';
    
    if (user.empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.empresaId },
        select: { TipoIndustria: true },
      });
      tipoIndustria = empresa?.TipoIndustria || 'GENERICA';
    }

    // Claims estándar JWT según RFC 7519
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      // Claims estándar
      iat: now, // Issued at - cuándo fue emitido
      jti: uuidv4(), // JWT ID - identificador único del token
      sub: user.id, // Subject - identificador del usuario
      
      // Claims personalizados
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      tipoIndustria: tipoIndustria,
    };

    
    const token = this.jwtService.sign(payload);
    
    // Log del login exitoso
    this.jwtAuditService.logLogin(user.id, user.email);
    
    return token;
  }


//BORRAR
  async registerEmpresa(dto: RegisterEmpresaDto) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario registrado con este correo');
    }
  // 1. Crear empresa
    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: dto.nombreEmpresa,
        emailContacto: dto.email,
        TipoIndustria: dto.industria,
      },
    });

    // 2. Crear usuario ADMIN vinculado a empresa
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombreUsuario,
        email: dto.email,
        password: hashedPassword,
        rol: 'SUPERADMIN',
        empresaId: empresa.id,
      },
    });

    const usuarioParaLogin = { ...usuario, empresaId: usuario.empresaId ?? undefined };
    return this.login(usuarioParaLogin);
  }

  async getCurrentUser(res: any) {
    const token = res?.cookies?.jwt;
      

    if (!token) {
      throw new UnauthorizedException('No autorizado');
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return user;
    }
    catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }



  async loginWithGoogle(googleUser: any) {
    try {
      // Validar datos del usuario de Google
      if (!googleUser || !googleUser.email || !googleUser.googleId) {
        throw new BadRequestException('Datos de Google OAuth inválidos');
      }

      // Buscar usuario por googleId o email
      let user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { googleId: googleUser.googleId },
            { email: googleUser.email },
          ],
        },
      });

      // Si no existe, crear usuario automáticamente
      if (!user) {
        // Verificar que el email no esté en uso por otro usuario
        const existingUserWithEmail = await this.prisma.usuario.findUnique({
          where: { email: googleUser.email },
        });

        if (existingUserWithEmail && existingUserWithEmail.authProvider !== 'google') {
          throw new BadRequestException('Este email ya está registrado con otro método de autenticación');
        }

        const data: any = {
          nombre: googleUser.nombre || 'Usuario Google',
          email: googleUser.email,
          googleId: googleUser.googleId,
          authProvider: 'google',
          rol: 'ADMIN', // Rol por defecto, se puede cambiar después
          setupCompletado: false, // Necesitará configurar empresa
        };
        
        user = await this.prisma.usuario.create({ data });
        
        // Log del registro exitoso
        this.jwtAuditService.logJwtEvent('GOOGLE_REGISTER', user.id, user.email, {
          provider: 'google',
          googleId: googleUser.googleId,
        });
      } else {
        // Si el usuario existe pero no tiene googleId, actualizarlo
        if (!user.googleId) {
          user = await this.prisma.usuario.update({
            where: { id: user.id },
            data: { 
              googleId: googleUser.googleId,
              authProvider: 'google',
              nombre: googleUser.nombre || user.nombre,
            },
          });
        }
      }

      // Emitir JWT igual que en login tradicional
      const userParaLogin = { ...user, empresaId: user.empresaId ?? undefined };
      const token = await this.login(userParaLogin);
      
      // Log del login exitoso
      this.jwtAuditService.logJwtEvent('GOOGLE_LOGIN', user.id, user.email, {
        provider: 'google',
        googleId: googleUser.googleId,
      });

      return token;
    } catch (error) {
      this.jwtAuditService.logJwtEvent('GOOGLE_ERROR', undefined, googleUser?.email, {
        error: error.message,
        provider: 'google',
      });
      throw error;
    }
  }

  // Nuevo método para registro de usuario individual
  async registerUser(dto: RegisterUserDto) {
    try {
      // Verificar que el email no esté en uso
      const existingUser = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario registrado con este correo');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear usuario sin empresa (setup pendiente)
      const data: any = {
        nombre: dto.nombre,
        email: dto.email,
        password: hashedPassword,
        rol: 'ADMIN', // Rol por defecto, se puede cambiar después
        authProvider: 'local',
        setupCompletado: false, // Necesitará configurar empresa
        // empresaId será null hasta que configure la empresa
      };

      const usuario = await this.prisma.usuario.create({ data });
      
      // Log del registro exitoso
      this.jwtAuditService.logJwtEvent('USER_REGISTER', usuario.id, usuario.email, {
        provider: 'local',
        method: 'email_password',
      });

      // Emitir JWT para login automático
      const usuarioParaLogin = { ...usuario, empresaId: usuario.empresaId ?? undefined };
      const token = await this.login(usuarioParaLogin);

      return {
        message: 'Usuario registrado exitosamente. Completa la configuración de tu empresa.',
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          setupCompletado: usuario.setupCompletado,
        },
        needsSetup: true,
      };
    } catch (error) {
      this.jwtAuditService.logJwtEvent('USER_REGISTER_ERROR', undefined, dto.email, {
        error: error.message,
        provider: 'local',
      });
      throw error;
    }
  }

  // Nuevo método para setup de empresa con transacciones
  async setupEmpresa(userId: number, dto: SetupEmpresaDto) {
    // Log de inicio de setup
    this.jwtAuditService.logSetupStarted(userId, 'unknown', {
      empresaName: dto.nombreEmpresa,
      tipoIndustria: dto.tipoIndustria,
    });

    try {
      // Usar transacción para prevenir race conditions y asegurar consistencia
      const result = await this.prisma.$transaction(async (prisma) => {
        // Verificar que el usuario existe y no tiene empresa (con lock optimista)
        const user = await prisma.usuario.findUnique({
          where: { id: userId },
          include: { empresa: true },
        });

        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }

        if (user.empresaId) {
          throw new BadRequestException('El usuario ya tiene una empresa configurada');
        }

        // Verificar que el RFC no esté en uso (si se proporciona)
        if (dto.rfc && dto.rfc.trim()) {
          const existingEmpresa = await prisma.empresa.findUnique({
            where: { rfc: dto.rfc.trim() },
          });
          if (existingEmpresa) {
            throw new BadRequestException('El RFC ya está registrado en el sistema');
          }
        }

        // Preparar datos de empresa, excluyendo RFC si está vacío
        const empresaData: any = {
          nombre: dto.nombreEmpresa,
          emailContacto: user.email,
          TipoIndustria: dto.tipoIndustria,
          direccion: dto.direccion,
        };

        // Solo incluir RFC si se proporciona y no está vacío
        if (dto.rfc && dto.rfc.trim()) {
          empresaData.rfc = dto.rfc.trim();
        }

        // Crear empresa
        const empresa = await prisma.empresa.create({
          data: empresaData,
        });

        // Actualizar usuario
        const updatedUser = await prisma.usuario.update({
          where: { id: userId },
          data: {
            empresaId: empresa.id,
            rol: 'ADMIN', // Mantener rol ADMIN, no cambiar a SUPERADMIN
            setupCompletado: true, // Marcar setup como completado
          },
        });

        return { empresa, updatedUser };
      }, {
        maxWait: 5000, // Máximo 5 segundos de espera
        timeout: 10000, // Timeout de 10 segundos
        isolationLevel: 'Serializable', // Nivel más alto de aislamiento
      });

      // Log de setup completado exitosamente
      this.jwtAuditService.logSetupCompleted(userId, result.updatedUser.email, result.empresa.id, {
        empresaName: result.empresa.nombre,
        tipoIndustria: result.empresa.TipoIndustria,
      });

      // Generar nuevo JWT con la información de empresa actualizada
      const userParaLogin = { 
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        rol: result.updatedUser.rol,
        empresaId: result.empresa.id,
        tipoIndustria: result.empresa.TipoIndustria 
      };
      const newToken = await this.login(userParaLogin);

      return {
        message: 'Empresa configurada exitosamente',
        token: newToken, // Incluir el nuevo token
        empresa: {
          id: result.empresa.id,
          nombre: result.empresa.nombre,
          tipoIndustria: result.empresa.TipoIndustria,
          rfc: result.empresa.rfc,
          direccion: result.empresa.direccion,
        },
        user: {
          id: result.updatedUser.id,
          nombre: result.updatedUser.nombre,
          email: result.updatedUser.email,
          rol: result.updatedUser.rol,
        },
      };
    } catch (error) {
      // Log de error en setup
      this.jwtAuditService.logSetupFailed(userId, 'unknown', error.message, {
        empresaName: dto.nombreEmpresa,
        tipoIndustria: dto.tipoIndustria,
        errorCode: error.code,
      });

      // Re-lanzar el error para que sea manejado por los filtros globales
      throw error;
    }
  }

  // Método para verificar si el usuario necesita setup
  async needsSetup(userId: number): Promise<boolean> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { empresaId: true, setupCompletado: true, email: true },
    });

    if (!user) {
      this.jwtAuditService.logSetupCheck(userId, 'unknown', true, {
        reason: 'user_not_found',
        userId,
      });
      return true;
    }

    // El usuario necesita setup si no tiene empresa O si setupCompletado es false
    const needsSetup = !user?.empresaId || !user?.setupCompletado;
    
    // Log de auditoría para cada consulta
    this.jwtAuditService.logSetupCheck(userId, user.email, needsSetup, {
      hasEmpresa: !!user.empresaId,
      setupCompletado: user.setupCompletado,
    });

    return needsSetup;
  }

  // Método para obtener el estado completo del usuario
  async getUserStatus(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const needsSetup = !user.empresaId || !user.setupCompletado;

    // Log de auditoría para consulta de estado
    this.jwtAuditService.logSetupCheck(userId, user.email, needsSetup, {
      action: 'get_status',
      hasEmpresa: !!user.empresaId,
      setupCompletado: user.setupCompletado,
    });

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresaId: user.empresaId,
        setupCompletado: user.setupCompletado,
        authProvider: user.authProvider,
        activo: user.activo,
      },
      empresa: user.empresa ? {
        id: user.empresa.id,
        nombre: user.empresa.nombre,
        tipoIndustria: user.empresa.TipoIndustria,
        rfc: user.empresa.rfc,
        direccion: user.empresa.direccion,
      } : null,
      needsSetup,
      setupStatus: {
        hasEmpresa: !!user.empresaId,
        setupCompletado: user.setupCompletado,
        isComplete: !needsSetup,
      },
    };
  }
}
