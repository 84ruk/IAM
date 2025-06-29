import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('Usuario no El correo proporcionado no está registrado');
    }

    if (!user.password) {
      throw new UnauthorizedException('Este usuario solo puede iniciar sesión con Google');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Contraseña incorrecta');

    return user;
  }
} 