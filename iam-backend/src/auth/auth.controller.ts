import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { RateLimit, RateLimitGuard } from './guards/rate-limit.guard';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { SetupEmpresaDto } from './dto/setup-empresa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtUser } from './interfaces/jwt-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { SkipEmpresaCheck } from './decorators/skip-empresa-check.decorator';
import { Public } from './decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
@SkipEmpresaCheck()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('login')
  @Public() // Marcar como ruta pública
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  @RateLimit({ action: 'login' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const userParaLogin = { ...user, empresaId: user.empresaId ?? undefined };
    const { token, refreshToken } = await this.authService.login(userParaLogin);

    // Configuración de cookies configurable
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain =
      process.env.COOKIE_DOMAIN ||
      (isProduction ? '.iaminventario.com.mx' : 'localhost');

    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: cookieDomain,
      path: '/',
    };

    res.cookie('jwt', token, cookieOptions);

    return {
      message: 'Login exitoso',
      refreshToken: refreshToken,
    };
  }

  @Post('logout')
  @Public() // Marcar como ruta pública
  @HttpCode(200)
  async logout(
    @CurrentUser() user: JwtUser | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain =
      process.env.COOKIE_DOMAIN ||
      (isProduction ? '.iaminventario.com.mx' : 'localhost');

    // Configuración de cookies para limpiar
    const clearCookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      secure: isProduction,
      domain: cookieDomain,
      path: '/',
      expires: new Date(0), // Expirar inmediatamente
    };

    // Limpiar la cookie JWT
    res.clearCookie('jwt', clearCookieOptions);

    // Si hay un usuario autenticado, revocar tokens y hacer log
    if (user) {
      // Revocar todos los refresh tokens del usuario
      await this.refreshTokenService.revokeAllUserTokens(user.id);

      // Log de auditoría
      this.authService['jwtAuditService'].logLogout(user.id, user.email);
    }

    return { message: 'Sesión cerrada' };
  }

  @Post('register-empresa')
  @Public() // Marcar como ruta pública
  @HttpCode(201)
  @UseGuards(RateLimitGuard)
  @RateLimit({ action: 'registration' })
  async registerEmpresa(@Body() dto: RegisterEmpresaDto) {
    return this.authService.registerEmpresa(dto);
  }

  @Post('register')
  @Public() // Marcar como ruta pública
  @SkipEmpresaCheck()
  @HttpCode(201)
  @UseGuards(RateLimitGuard)
  @RateLimit({ action: 'registration' })
  async registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('setup-empresa')
  @HttpCode(200)
  async setupEmpresa(
    @Body() dto: SetupEmpresaDto,
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.setupEmpresa(user.id, dto);

    // Establecer la cookie con el nuevo token automáticamente
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain =
      process.env.COOKIE_DOMAIN ||
      (isProduction ? '.iaminventario.com.mx' : 'localhost');

    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: cookieDomain,
      path: '/',
    };

    res.cookie('jwt', result.token, cookieOptions);

    // Log de auditoría para la actualización de cookie
    this.authService['jwtAuditService'].logJwtEvent(
      'SETUP_COOKIE_UPDATED',
      user.id,
      user.email,
      {
        action: 'setup_empresa_cookie_update',
        empresaId: result.empresa.id,
        empresaName: result.empresa.nombre,
        userAgent: res.req?.headers['user-agent'],
        ip: res.req?.ip,
      },
    );

    return result;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('forgot-password')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ action: 'passwordReset' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('reset-password/:token')
  @Public()
  async verifyResetToken(@Param('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('refresh')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ action: 'refresh' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, newRefreshToken } =
      await this.refreshTokenService.generateNewAccessToken(dto.refreshToken);

    // Configuración de cookies configurable
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain =
      process.env.COOKIE_DOMAIN ||
      (isProduction ? '.iaminventario.com.mx' : 'localhost');

    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: cookieDomain,
      path: '/',
    };

    res.cookie('jwt', accessToken, cookieOptions);

    return {
      message: 'Token renovado exitosamente',
      refreshToken: newRefreshToken,
    };
  }

  @Get('needs-setup')
  @Public() // Marcar como ruta pública
  @HttpCode(200)
  async needsSetup(@Req() req: Request) {
    const token =
      req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');

    // Si no hay token, asumir que necesita setup
    if (!token) {
      return {
        needsSetup: true,
        message: 'No authentication token provided',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Verificar token
      const payload = this.jwtService.verify(token);
      const needsSetup = await this.authService.needsSetup(payload.sub);
      const userStatus = await this.authService.getUserStatus(payload.sub);

      return {
        needsSetup,
        user: userStatus.user,
        empresa: userStatus.empresa,
        setupStatus: userStatus.setupStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Token inválido o expirado
      return {
        needsSetup: true,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('me')
  @HttpCode(200)
  async getMe(@CurrentUser() user: JwtUser) {
    const userParaLogin = { ...user, empresaId: user.empresaId ?? undefined };
    return userParaLogin;
  }

  @Get('status')
  @HttpCode(200)
  async getUserStatus(@CurrentUser() user: JwtUser) {
    const userStatus = await this.authService.getUserStatus(user.id);
    return userStatus;
  }

  @Get('google')
  @Public() // Marcar como ruta pública
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Inicia el flujo de OAuth con Google
  }

  @Get('google/callback')
  @Public() // Marcar como ruta pública
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const googleUser = req.user;
    // Buscar o validar usuario y emitir JWT
    const { token, refreshToken } =
      await this.authService.loginWithGoogle(googleUser);
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain =
      process.env.COOKIE_DOMAIN ||
      (isProduction ? '.iaminventario.com.mx' : 'localhost');

    const cookieOptions: any = {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      domain: cookieDomain,
      path: '/',
    };
    res.cookie('jwt', token, cookieOptions);
    // Redirigir al frontend o devolver mensaje
    res.redirect(process.env.FRONTEND_URL || '/');
  }

  @Get('google/status')
  @Public() // Marcar como ruta pública
  @HttpCode(200)
  async getGoogleOAuthStatus() {
    return {
      enabled:
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured',
    };
  }
}
