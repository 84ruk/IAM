import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { ESP32SensorService, SensorData } from './esp32-sensor.service';
import { CreateSensorLecturaDto } from './dto/create-sensor-lectura.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSensorLecturaMultipleDto } from './dto/create-sensor-lectura-multiple.dto';
import { DashboardUbicacionTiempoRealDto, DashboardAlertasDto } from './dto/dashboard.dto';
import { ESP32ConfiguracionDto as ESP32Configuracion } from './dto/esp32-configuracion.dto';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { SensorTipo } from '@prisma/client';

interface QueryFilters {
  tipo?: SensorTipo;
  productoId?: string;
  desde?: string;
  hasta?: string;
  limite?: string;
}

@Controller('sensores')
export class SensoresController {
  private readonly logger = new Logger(SensoresController.name);

  constructor(
    private readonly sensoresService: SensoresService,
    private readonly esp32SensorService: ESP32SensorService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @Post('lectura')
  async recibirLectura(@Body() dto: CreateSensorLecturaDto, @Request() req) {
    try {
      const user = req.user as JwtUser;
      this.logger.log(`📊 Recibiendo lectura de sensor: ${dto.tipo} - Valor: ${dto.valor}${dto.unidad}`);
      
      // Log de headers para debugging de ESP32
      if (req.headers['user-agent']?.includes('ESP32') || req.headers['x-esp32-device']) {
        this.logger.log(`🤖 Lectura recibida de ESP32 - IP: ${req.ip} - Headers:`, {
          'user-agent': req.headers['user-agent'],
          'x-esp32-device': req.headers['x-esp32-device'],
          'x-device-type': req.headers['x-device-type']
        });
      }

      // Validar datos de lectura
      if (!dto.tipo || dto.valor === undefined || !dto.unidad) {
        this.logger.error(`❌ Datos de lectura incompletos: ${JSON.stringify(dto)}`);
        throw new Error('Datos de lectura incompletos');
      }

      const resultado = await this.sensoresService.registrarLectura(dto, user.empresaId!);
      this.logger.log(`✅ Lectura registrada exitosamente: ${resultado.id}`);
      
      return {
        success: true,
        message: 'Lectura registrada exitosamente',
        lectura: resultado
      };
    } catch (error) {
      this.logger.error(`❌ Error registrando lectura:`, error);
      throw error;
    }
  }

  @Post('lecturas-multiples')
  async recibirLecturasMultiples(@Body() dto: CreateSensorLecturaMultipleDto) {
    return this.esp32SensorService.registrarLecturasMultiples(dto);
  }

  @Post('generar-codigo-arduino')
  async generarCodigoArduino(@Body() config: ESP32Configuracion) {
    return this.esp32SensorService.generarCodigoArduino(config);
  }

  @Get('esp32-config/:deviceId')
  async obtenerConfiguracionESP32(@Param('deviceId') deviceId: string) {
    return this.esp32SensorService.obtenerConfiguracionESP32(deviceId);
  }

  @Get('esp32-status/:deviceId')
  async obtenerEstadoESP32(@Param('deviceId') deviceId: string) {
    return this.esp32SensorService.obtenerEstadoESP32(deviceId);
  }

  @Get('esp32-stats')
  async obtenerEstadisticasESP32() {
    return this.esp32SensorService.obtenerEstadisticasESP32();
  }

  @Get('lecturas')
  async obtenerLecturas(@Request() req, @Query() query: QueryFilters) {
    const user = req.user as JwtUser;
    const filtros = {
      tipo: query.tipo,
      productoId: query.productoId ? parseInt(query.productoId) : undefined,
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      limite: query.limite ? parseInt(query.limite) : 100,
    };
    
    return this.sensoresService.obtenerLecturas(user.empresaId!, filtros);
  }

  @Get('analytics')
  async obtenerAnalytics(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerAnalytics(user.empresaId!);
  }

  @Get('alertas')
  async obtenerAlertas(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerAlertas(user.empresaId!);
  }

  @Post('simular')
  async simularLectura(@Request() req, @Body() data: { productoId?: number }) {
    const user = req.user as JwtUser;
    return this.sensoresService.simularLectura(user.empresaId!, data.productoId);
  }

  // Nuevos endpoints para gestión de sensores registrados
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @Post('registrar')
  async registrarSensor(@Body() createSensorDto: CreateSensorDto, @Request() req) {
    try {
      const user = req.user as JwtUser;
      this.logger.log(`🔧 Usuario ${user.email} intentando registrar sensor: ${createSensorDto.nombre}`);
      
      // Validar que el usuario tenga empresa asignada
      if (!user.empresaId) {
        this.logger.error(`❌ Usuario ${user.email} no tiene empresa asignada`);
        throw new Error('Usuario no tiene empresa asignada');
      }

      // Validar datos requeridos
      if (!createSensorDto.nombre || !createSensorDto.tipo || !createSensorDto.ubicacionId) {
        this.logger.error(`❌ Datos incompletos para registro de sensor: ${JSON.stringify(createSensorDto)}`);
        throw new Error('Datos incompletos para registro de sensor');
      }

      this.logger.log(`✅ Datos validados, procediendo con registro...`);
      const sensor = await this.sensoresService.registrarSensor(createSensorDto, user.empresaId!);
      
      this.logger.log(`🎉 Sensor registrado exitosamente: ${sensor.nombre} (ID: ${sensor.id})`);
      return {
        success: true,
        message: 'Sensor registrado exitosamente',
        sensor: sensor
      };
    } catch (error) {
      this.logger.error(`❌ Error en endpoint de registro de sensor:`, error);
      throw error;
    }
  }

  @Get('listar')
  async obtenerSensores(@Request() req, @Query('ubicacionId') ubicacionId?: string, @Query('estado') estado?: 'activos' | 'inactivos' | 'todos') {
    const user = req.user as JwtUser;
    const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
    return this.sensoresService.obtenerSensores(user.empresaId!, ubicacionIdNum, estado);
  }

  @Get('sensor/:id')
  async obtenerSensor(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerSensor(+id, user.empresaId!);
  }

  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @Patch('sensor/:id')
  async actualizarSensor(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateSensorDto>,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    return this.sensoresService.actualizarSensor(+id, updateData, user.empresaId!);
  }

  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @Delete('sensor/:id')
  async eliminarSensor(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.eliminarSensor(+id, user.empresaId!);
  }

  // Endpoints del Dashboard
  @Get('dashboard/ubicaciones')
  async obtenerDashboardUbicaciones(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerDashboardUbicaciones(user.empresaId!);
  }

  @Get('dashboard/ubicacion/:id/tiempo-real')
  async obtenerDashboardTiempoReal(
    @Param('id') id: string,
    @Request() req,
    @Query() query: DashboardUbicacionTiempoRealDto,
  ) {
    const user = req.user as JwtUser;
    const opciones = {
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      limite: query.limite,
    };
    return this.sensoresService.obtenerDashboardTiempoReal(+id, user.empresaId!, opciones);
  }

  @Get('dashboard/alertas')
  async obtenerDashboardAlertas(
    @Request() req,
    @Query() query: DashboardAlertasDto,
  ) {
    const user = req.user as JwtUser;
    const filtros = {
      ubicacionId: query.ubicacionId,
      tipo: query.tipo,
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
    };
    return this.sensoresService.obtenerDashboardAlertas(user.empresaId!, filtros);
  }

  // Endpoint especial para ESP32 sin autenticación JWT
  @Public()
  @Post('iot/lectura')
  async recibirLecturaESP32(@Body() dto: CreateSensorLecturaDto, @Request() req) {
    try {
      this.logger.log(`🤖 Lectura recibida de ESP32: ${dto.tipo} - Valor: ${dto.valor}${dto.unidad}`);
      
      // Log de información del ESP32
      this.logger.debug(`📡 Headers ESP32:`, {
        'user-agent': req.headers['user-agent'],
        'x-esp32-device': req.headers['x-esp32-device'],
        'x-device-type': req.headers['x-device-type'],
        'x-empresa-id': req.headers['x-empresa-id'],
        'ip': req.ip
      });

      // Obtener empresa ID del header (ESP32 debe enviarlo)
      const empresaId = parseInt(req.headers['x-empresa-id'] as string);
      if (!empresaId || isNaN(empresaId)) {
        this.logger.error(`❌ ESP32 no envió empresa ID válido`);
        throw new Error('Empresa ID requerido para lecturas de ESP32');
      }

      // Validar datos de lectura
      if (!dto.tipo || dto.valor === undefined || !dto.unidad) {
        this.logger.error(`❌ Datos de lectura incompletos: ${JSON.stringify(dto)}`);
        throw new Error('Datos de lectura incompletos');
      }

      // 🔧 CORREGIR: Convertir valores 0 a undefined para evitar errores de validación
      if (dto.productoId === 0) dto.productoId = undefined;
      if (dto.sensorId === 0) dto.sensorId = undefined;

      // Validar que la empresa existe
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId }
      });
      if (!empresa) {
        this.logger.error(`❌ Empresa no encontrada: ${empresaId}`);
        throw new Error('Empresa no encontrada');
      }

      // Registrar lectura
      const resultado = await this.sensoresService.registrarLectura(dto, empresaId);
      this.logger.log(`✅ Lectura de ESP32 registrada exitosamente: ${resultado.id}`);
      
      return {
        success: true,
        message: 'Lectura registrada exitosamente',
        lectura: resultado,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error registrando lectura de ESP32:`, error);
      throw error;
    }
  }

  // Endpoint para registro de sensor desde ESP32
  @Public()
  @Post('iot/registrar-sensor')
  async registrarSensorESP32(@Body() createSensorDto: CreateSensorDto, @Request() req) {
    try {
      this.logger.log(`🤖 Registro de sensor solicitado por ESP32: ${createSensorDto.nombre}`);
      
      // Obtener empresa ID del header
      const empresaId = parseInt(req.headers['x-empresa-id'] as string);
      if (!empresaId || isNaN(empresaId)) {
        this.logger.error(`❌ ESP32 no envió empresa ID válido`);
        throw new Error('Empresa ID requerido para registro de sensores');
      }

      // Validar datos del sensor
      if (!createSensorDto.nombre || !createSensorDto.tipo || !createSensorDto.ubicacionId) {
        this.logger.error(`❌ Datos de sensor incompletos: ${JSON.stringify(createSensorDto)}`);
        throw new Error('Datos de sensor incompletos');
      }

      // 🔧 CORREGIR: Asegurar que el sensor se cree como activo
      if (createSensorDto.activo === undefined) {
        createSensorDto.activo = true;
      }

      // Registrar sensor
      const sensor = await this.sensoresService.registrarSensor(createSensorDto, empresaId);
      this.logger.log(`✅ Sensor registrado desde ESP32 exitosamente: ${sensor.nombre} (ID: ${sensor.id})`);
      
      return {
        success: true,
        message: 'Sensor registrado exitosamente',
        sensor: sensor,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error registrando sensor desde ESP32:`, error);
      throw error;
    }
  }

  // 🔧 NUEVO: Endpoint de health check para ESP32
  @Public()
  @Get('iot/health')
  async healthCheck(@Request() req) {
    try {
      this.logger.log(`🔍 Health check solicitado por ESP32`);
      
      // Obtener empresa ID del header
      const empresaId = parseInt(req.headers['x-empresa-id'] as string);
      if (!empresaId || isNaN(empresaId)) {
        this.logger.error(`❌ ESP32 no envió empresa ID válido`);
        throw new Error('Empresa ID requerido para health check');
      }

      // Verificar que la empresa existe
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId }
      });
      if (!empresa) {
        this.logger.error(`❌ Empresa no encontrada: ${empresaId}`);
        throw new Error('Empresa no encontrada');
      }

      this.logger.log(`✅ Health check exitoso para empresa: ${empresa.nombre}`);
      
      return {
        success: true,
        message: 'Backend funcionando correctamente',
        empresa: empresa.nombre,
        timestamp: new Date().toISOString(),
        status: 'OK'
      };
    } catch (error) {
      this.logger.error(`❌ Error en health check:`, error);
      throw error;
    }
  }
}
