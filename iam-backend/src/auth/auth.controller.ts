import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtUser } from './interfaces/jwt-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = await this.authService.login(user);


      const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const, // para evitar CSRF
      secure: process.env.NODE_ENV === 'production', // habilitar en producción
      maxAge: 1000 * 60 * 60, // 1 hora
    };
    res.cookie('jwt', token, cookieOptions);
 
    return { message: 'Login exitoso', token }; //QUITAR TOKEN
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {

    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return { message: 'Sesión cerrada' };
  }

  @Post('register-empresa')
  @HttpCode(201)
  async registerEmpresa(@Body() dto: RegisterEmpresaDto) {
    return this.authService.registerEmpresa(dto);
  }

  @Get('me')
  @HttpCode(200)
  getMe(@CurrentUser() user: JwtUser) {
    return user;
  }
}