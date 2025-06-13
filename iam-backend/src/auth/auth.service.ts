import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }



  async registerEmpresa(dto: RegisterEmpresaDto) {
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
        rol: 'ADMIN',
        empresaId: empresa.id,
      },
    });

    // 3. Retornar JWT
    return this.login(usuario);
  }
}
