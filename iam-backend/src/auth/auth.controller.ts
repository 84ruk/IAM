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
    console.log('Login request received');


    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = await this.authService.login(user);


      const cookieOptions = {
      httpOnly: true,
      sameSite: 'none' as const, // Permitir cross-domain
      secure: true, // Siempre secure en producción
      maxAge: 1000 * 60 * 60, // 1 hora
    };
    res.cookie('jwt', token, cookieOptions);
 
    return { message: 'Login exitoso', token }; //QUITAR TOKEN por que se va al front
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {

    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
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
    return user; // El usuario ya está validado por el guardia JWT
  }
}