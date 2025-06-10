import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
}
