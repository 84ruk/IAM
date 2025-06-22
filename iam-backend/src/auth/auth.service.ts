import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { PrismaService } from '../prisma/prisma.service';


interface JwtUserPayload {
  id: number;
  email: string;
  rol: string;
  empresaId: number;
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
    if (!user) throw new NotFoundException('Usuario no El correo proporcionado no está registrado');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

    return user;
  }

  async login(user: JwtUserPayload) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
    };

    if (!user) {
      throw new NotFoundException('El correo proporcionado no está registrado');
    }
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
}
