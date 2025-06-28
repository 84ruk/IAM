import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { JwtUser } from './interfaces/jwt-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    console.log('Login request received for email:', dto.email);

    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = await this.authService.login(user);

    // Configuración de cookies optimizada para middleware de Next.js
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      secure: isProduction, // Solo HTTPS en producción
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      path: '/', // Importante: asegurar que la cookie esté disponible en todo el dominio
    };
    
    // Solo agregar domain en producción
    if (isProduction) {
      cookieOptions.domain = '.fly.dev';
    }
    
    res.cookie('jwt', token, cookieOptions);
    
    console.log('Cookie set successfully');
 
    return { message: 'Login exitoso' };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    console.log('Logout request received');

    const isProduction = process.env.NODE_ENV === 'production';
    
    const clearCookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      secure: isProduction,
      path: '/',
    };
    
    if (isProduction) {
      clearCookieOptions.domain = '.fly.dev';
    }
    
    res.clearCookie('jwt', clearCookieOptions);
    
    console.log('Cookie cleared successfully');
    return { message: 'Sesión cerrada' };
  }

  @Post('register-empresa')
  @HttpCode(201)
  async registerEmpresa(@Body() dto: RegisterEmpresaDto) {
    return this.authService.registerEmpresa(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(200)
  async getMe(@CurrentUser() user: JwtUser) {
    console.log('Auth/me request received for user:', user.email);
    return user;
  }
}