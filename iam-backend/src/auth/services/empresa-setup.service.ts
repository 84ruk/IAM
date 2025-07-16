import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';
import { JwtAuditService } from '../jwt-audit.service';
import { RegisterEmpresaDto } from '../dto/register-empresa.dto';
import { SetupEmpresaDto } from '../dto/setup-empresa.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmpresaSetupService {
  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService,
    private jwtAuditService: JwtAuditService,
  ) {}

  /**
   * Registrar una nueva empresa con su administrador
   */
  async registerEmpresa(dto: RegisterEmpresaDto) {
    // Validar que no exista un usuario con ese email
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Ya existe un usuario registrado con este correo',
      );
    }

    // Crear empresa
    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: dto.nombreEmpresa,
        emailContacto: dto.email,
        TipoIndustria: dto.industria as any,
      },
    });

    // Crear usuario SUPERADMIN vinculado a empresa
    const hashedPassword = await bcrypt.hash(dto.password, 12); // Aumentado a 12 rounds

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombreUsuario,
        email: dto.email,
        password: hashedPassword,
        rol: 'SUPERADMIN',
        empresaId: empresa.id,
        setupCompletado: true, // Ya está configurado
      },
    });

    // Log de la creación
    this.secureLogger.logEmpresaCreation(
      empresa.nombre,
      usuario.email,
      empresa.id,
    );
    this.jwtAuditService.logJwtEvent(
      'EMPRESA_REGISTER',
      usuario.id,
      usuario.email,
      {
        empresaId: empresa.id,
        empresaNombre: empresa.nombre,
        industria: empresa.TipoIndustria,
      },
    );

    return {
      message: 'Empresa registrada exitosamente',
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        tipoIndustria: empresa.TipoIndustria,
      },
    };
  }

  /**
   * Configurar empresa para un usuario existente
   */
  async setupEmpresa(userId: number, dto: SetupEmpresaDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.setupCompletado) {
      throw new BadRequestException(
        'El usuario ya tiene una empresa configurada',
      );
    }

    // Verificar si ya existe una empresa con ese nombre
    const existingEmpresa = await this.prisma.empresa.findFirst({
      where: { nombre: dto.nombreEmpresa },
    });

    if (existingEmpresa) {
      throw new BadRequestException('Ya existe una empresa con ese nombre');
    }

    // Crear empresa
    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: dto.nombreEmpresa,
        emailContacto: user.email,
        TipoIndustria: dto.tipoIndustria as any,
      },
    });

    // Actualizar usuario
    const updatedUser = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        empresaId: empresa.id,
        setupCompletado: true,
        rol: 'ADMIN', // Cambiar a ADMIN si no era SUPERADMIN
      },
    });

    // Log de la configuración
    this.secureLogger.logEmpresaCreation(
      empresa.nombre,
      user.email,
      empresa.id,
    );
    this.jwtAuditService.logJwtEvent('EMPRESA_SETUP', userId, user.email, {
      empresaId: empresa.id,
      empresaNombre: empresa.nombre,
      industria: empresa.TipoIndustria,
    });

    return {
      message: 'Empresa configurada exitosamente',
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        tipoIndustria: empresa.TipoIndustria,
      },
      user: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol: updatedUser.rol,
        empresaId: updatedUser.empresaId,
      },
    };
  }

  /**
   * Verificar si un usuario necesita configurar empresa
   */
  async needsSetup(userId: number): Promise<boolean> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { setupCompletado: true, empresaId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return !user.setupCompletado || !user.empresaId;
  }

  /**
   * Obtener el estado de configuración del usuario
   */
  async getUserStatus(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      setupCompletado: user.setupCompletado,
      empresa: user.empresa
        ? {
            id: user.empresa.id,
            nombre: user.empresa.nombre,
            tipoIndustria: user.empresa.TipoIndustria,
          }
        : null,
    };
  }

  /**
   * Validar configuración de empresa
   */
  async validateEmpresaSetup(userId: number): Promise<{
    isValid: boolean;
    needsSetup: boolean;
    empresa?: any;
    errors?: string[];
  }> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      return {
        isValid: false,
        needsSetup: true,
        errors: ['Usuario no encontrado'],
      };
    }

    const errors: string[] = [];

    if (!user.setupCompletado) {
      errors.push('Configuración de empresa incompleta');
    }

    if (!user.empresaId) {
      errors.push('Usuario no tiene empresa asignada');
    }

    if (user.empresaId && !user.empresa) {
      errors.push('Empresa asignada no existe');
    }

    const needsSetup =
      !user.setupCompletado || !user.empresaId || !user.empresa;
    const isValid = errors.length === 0;

    return {
      isValid,
      needsSetup,
      empresa: user.empresa
        ? {
            id: user.empresa.id,
            nombre: user.empresa.nombre,
            tipoIndustria: user.empresa.TipoIndustria,
          }
        : null,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
