import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const token = await this.authService.login(user);

    // Set cookie segura
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // ✅ true en producción con HTTPS
      maxAge: 1000 * 60 * 60, // 1 hora
    });

    return { message: 'Login exitoso' };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'Sesión cerrada' };
  }
}
