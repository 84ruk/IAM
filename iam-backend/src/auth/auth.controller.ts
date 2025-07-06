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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
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
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 intentos por minuto para login
  async login(
    @Body() dto: LoginDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = await this.authService.login(user);

    // Configuración de cookies simplificada
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: isProduction ? '.iaminventario.com.mx' : 'localhost',
      path: '/',
    };
    
    res.cookie('jwt', token, cookieOptions);
    
    return { message: 'Login exitoso' };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configuración de cookies para limpiar
    const clearCookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      secure: isProduction,
      domain: isProduction ? '.iaminventario.com.mx' : 'localhost',
      path: '/',
      expires: new Date(0), // Expirar inmediatamente
    };
    
    // Limpiar la cookie JWT
    res.clearCookie('jwt', clearCookieOptions);
    
    return { message: 'Sesión cerrada' };
  }

  @Post('register-empresa')
  @HttpCode(201)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 3 } }) // 3 registros por 5 minutos para prevenir spam
  async registerEmpresa(@Body() dto: RegisterEmpresaDto) {
    return this.authService.registerEmpresa(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @HttpCode(200)
  async getMe(@CurrentUser() user: JwtUser) {
    // Devolver directamente la información del JWT (más seguro y eficiente)
    return user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Inicia el flujo de OAuth con Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res: Response) {
    const googleUser = req.user;
    // Buscar o validar usuario y emitir JWT
    const token = await this.authService.loginWithGoogle(googleUser);
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: isProduction ? '.iaminventario.com.mx' : 'localhost',
      path: '/',
    };
    res.cookie('jwt', token, cookieOptions);
    // Redirigir al frontend o devolver mensaje
    res.redirect(process.env.FRONTEND_URL || '/');
  }
}