import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface JwtUserPayload {
  id: number;
  email: string;
  rol: string;
  empresaId: number;
  tipoIndustria?: string; 
} 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // console.log('Usuario no encontrado:', email);
      throw new NotFoundException('Usuario no El correo proporcionado no está registrado');
    }

    if (!user.password) {
      throw new UnauthorizedException('Este usuario solo puede iniciar sesión con Google');
    }

    const passwordValid = await bcrypt.compare(password, user.password as string);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

    return user;
  }

  async login(user: JwtUserPayload) {

    if (!user) {
      throw new NotFoundException('El correo proporcionado no está registrado');
    }
    if (!user.empresaId) {
      throw new BadRequestException('El usuario no está vinculado a una empresa');
    }
    if (!user.rol) {
      throw new BadRequestException('El usuario no tiene un rol asignado');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: user.empresaId },
      select: { TipoIndustria: true },
    });

    // Claims estándar JWT según RFC 7519
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      // Claims estándar
      iss: 'iam-erp-saas.com', // Issuer - quién emitió el token
      aud: 'iam-erp-saas.com', // Audience - para quién es el token
      iat: now, // Issued at - cuándo fue emitido
      exp: now + (24 * 60 * 60), // Expiration - expira en 24 horas
      jti: uuidv4(), // JWT ID - identificador único del token
      sub: user.id, // Subject - identificador del usuario
      
      // Claims personalizados
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      tipoIndustria: empresa?.TipoIndustria || 'GENERICA',
    };

    
    return this.jwtService.sign(payload);
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

    return this.login(usuario);
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
    // Buscar usuario por googleId o email
    let user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
    });

    // Si no existe, no crear usuario automáticamente por seguridad
    if (!user) {
      throw new UnauthorizedException('No tienes acceso. Contacta al administrador.');
      // Si quieres permitir creación automática, descomenta lo siguiente y ajusta lógica de empresa/rol:
      // user = await this.prisma.usuario.create({
      //   data: {
      //     nombre: googleUser.nombre,
      //     email: googleUser.email,
      //     googleId: googleUser.googleId,
      //     authProvider: 'google',
      //     rol: 'EMPLEADO', // O el rol por defecto que prefieras
      //     empresaId: 1, // O la empresa por defecto
      //   },
      // });
    }

    // Emitir JWT igual que en login tradicional
    return this.login(user);
  }
}
