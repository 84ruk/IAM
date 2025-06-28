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

<<<<<<< HEAD
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'none' as const, // Cambiar a 'none' para cross-domain
      secure: true, // Siempre habilitar en producción
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: process.env.NODE_ENV === 'production' ? '.fly.dev' : undefined, // Dominio para producción
    };
    
=======
    console.log('Token generated successfully for user:', user.email);

    // Configuración de la cookie según el entorno
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = process.env.NODE_ENV === 'development';
    
    const cookieOptions = {
      httpOnly: true,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      secure: isProduction, // true en producción, false en localhost
      maxAge: 1000 * 60 * 60 * 24, // 24 horas en lugar de 1 hora
      path: '/',
    };

    console.log('Setting cookie with options:', cookieOptions);
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
    res.cookie('jwt', token, cookieOptions);
    
    console.log('Cookie set successfully');
 
<<<<<<< HEAD
    return { message: 'Login exitoso' };
=======
    return { message: 'Login exitoso' }; // Removido el token del body
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
<<<<<<< HEAD
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: process.env.NODE_ENV === 'production' ? '.fly.dev' : undefined,
=======
    console.log('Logout request received');

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/',
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
    });
    
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
<<<<<<< HEAD
    return user;
=======
    console.log('Auth/me request received for user:', user.email);
    return user; // El usuario ya está validado por el guardia JWT
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
  }
}