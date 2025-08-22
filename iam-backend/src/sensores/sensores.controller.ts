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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ValidationLoggingInterceptor } from '../common/interceptors/validation-logging.interceptor';
import { UseInterceptors } from '@nestjs/common';

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

  // 🚀 NUEVO: Endpoint principal para crear sensores (POST /sensores)
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.SUPERADMIN)
  @Post()
  async crearSensor(@Body() createSensorDto: CreateSensorDto, @CurrentUser() currentUser: JwtUser) {
    try {
      this.logger.log(`🔧 Usuario ${currentUser.email} creando sensor: ${createSensorDto.nombre}`);
      
      // Validar que el usuario tenga empresa asignada
      if (!currentUser.empresaId) {
        this.logger.error(`❌ Usuario ${currentUser.email} no tiene empresa asignada`);
        throw new Error('Usuario no tiene empresa asignada');
      }

      // Validar datos requeridos
      if (!createSensorDto.nombre || !createSensorDto.tipo || !createSensorDto.ubicacionId) {
        this.logger.error(`❌ Datos incompletos para creación de sensor: ${JSON.stringify(createSensorDto)}`);
        throw new Error('Datos incompletos para creación de sensor');
      }

      this.logger.log(`✅ Datos validados, procediendo con creación...`);
      const sensor = await this.sensoresService.registrarSensor(createSensorDto, currentUser.empresaId!);
      
      this.logger.log(`🎉 Sensor creado exitosamente: ${sensor.nombre} (ID: ${sensor.id})`);
      return {
        success: true,
        message: 'Sensor creado exitosamente',
        data: sensor
      };
    } catch (error) {
      this.logger.error(`❌ Error en endpoint de creación de sensor:`, error);
      throw error;
    }
  }

  // 🔧 NUEVO: Endpoint para obtener todos los sensores (GET /sensores)
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @Get()
  async obtenerTodosSensores(@CurrentUser() currentUser: JwtUser, @Query('ubicacionId') ubicacionId?: string, @Query('estado') estado?: 'activos' | 'inactivos' | 'todos') {
    try {
      const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
      const sensores = await this.sensoresService.obtenerSensores(currentUser.empresaId!, ubicacionIdNum, estado);
      
      return {
        success: true,
        message: 'Sensores obtenidos exitosamente',
        data: sensores
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo sensores:`, error);
      throw error;
    }
  }

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
  @UseInterceptors(ValidationLoggingInterceptor) // 🔧 NUEVO: Interceptor para logging de validación
  async generarCodigoArduino(@Body() config: ESP32Configuracion) {
    this.logger.log(`🚀 Generando código Arduino para dispositivo: ${config.deviceName}`);
    this.logger.log(`🔍 Configuración recibida:`, JSON.stringify(config, null, 2));
    
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
  async eliminarSensor(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) { 
    const user = currentUser;
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
      // Intentar asociar automáticamente la lectura a un sensor existente si no viene sensorId
      try {
        if ((!dto.sensorId || dto.sensorId === 0) && dto.ubicacionId) {
          this.logger.log(`🔍 Buscando sensor para asociar lectura automáticamente. Empresa: ${empresaId}, Ubicación: ${dto.ubicacionId}, Tipo: ${dto.tipo}`);
          const sensorMatch = await this.prisma.sensor.findFirst({
            where: {
              empresaId: empresaId,
              ubicacionId: dto.ubicacionId,
              tipo: dto.tipo,
              activo: true,
            },
            select: { id: true, nombre: true },
          });
          if (sensorMatch) {
            dto.sensorId = sensorMatch.id;
            this.logger.log(`🔗 Lectura asociada al sensor ${sensorMatch.nombre} (ID: ${sensorMatch.id})`);
          } else {
            this.logger.warn(`⚠️ No se encontró sensor activo para asociar la lectura automáticamente (empresa=${empresaId}, ubicacion=${dto.ubicacionId}, tipo=${dto.tipo}). Se registrará sin sensorId.`);
          }
        }
      } catch (assocErr) {
        this.logger.warn(`⚠️ Error intentando asociar sensor automáticamente: ${assocErr}`);
      }

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
      this.logger.log(`🤖 ===== INICIO REGISTRO SENSOR ESP32 =====`);
      this.logger.log(`🤖 Registro de sensor solicitado por ESP32: ${createSensorDto.nombre}`);
      this.logger.log(`📊 Datos completos del sensor: ${JSON.stringify(createSensorDto, null, 2)}`);
      this.logger.log(`🌐 Headers recibidos: ${JSON.stringify(req.headers, null, 2)}`);
      this.logger.log(`🌐 URL completa: ${req.url}`);
      this.logger.log(`🌐 Método: ${req.method}`);
      
      // Obtener empresa ID del header
      const empresaId = parseInt(req.headers['x-empresa-id'] as string);
      this.logger.log(`🏢 Empresa ID extraído del header: ${empresaId}`);
      const deviceIdHeader = (req.headers['x-device-id'] as string) || '';
      let dispositivoIoTId: number | null = null;
      
      if (!empresaId || isNaN(empresaId)) {
        this.logger.error(`❌ ESP32 no envió empresa ID válido`);
        throw new Error('Empresa ID requerido para registro de sensores');
      }

      // Validar datos del sensor
      this.logger.log(`🔍 Validando datos del sensor...`);
      this.logger.log(`   - Nombre: ${createSensorDto.nombre}`);
      this.logger.log(`   - Tipo: ${createSensorDto.tipo}`);
      this.logger.log(`   - Ubicación ID: ${createSensorDto.ubicacionId}`);
      this.logger.log(`   - Configuración: ${JSON.stringify(createSensorDto.configuracion)}`);
      this.logger.log(`   - Activo: ${createSensorDto.activo}`);
      this.logger.log(`   - Modo: ${createSensorDto.modo}`);
      this.logger.log(`   - Descripción: ${createSensorDto.descripcion}`);
      
      // 🔍 VALIDACIÓN ADICIONAL DE DATOS
      if (!createSensorDto.nombre || !createSensorDto.tipo || !createSensorDto.ubicacionId) {
        this.logger.error(`❌ Datos de sensor incompletos: ${JSON.stringify(createSensorDto)}`);
        throw new Error('Datos de sensor incompletos');
      }
      
      // 🔍 VALIDAR TIPO DE SENSOR
      const tiposValidos = ['TEMPERATURA', 'HUMEDAD', 'PESO', 'PRESION'];
      if (!tiposValidos.includes(createSensorDto.tipo)) {
        this.logger.error(`❌ Tipo de sensor inválido: ${createSensorDto.tipo}`);
        throw new Error(`Tipo de sensor inválido. Debe ser uno de: ${tiposValidos.join(', ')}`);
      }
      
      // 🔍 VALIDAR UBICACIÓN ID
      if (isNaN(createSensorDto.ubicacionId) || createSensorDto.ubicacionId <= 0) {
        this.logger.error(`❌ Ubicación ID inválido: ${createSensorDto.ubicacionId}`);
        throw new Error('Ubicación ID debe ser un número positivo');
      }
      
      this.logger.log(`✅ Validaciones básicas del DTO exitosas`);

      // Intentar resolver dispositivo IoT por header (si viene) para reglas de duplicados y vinculación
      if (deviceIdHeader) {
        try {
          const dispositivo = await this.prisma.dispositivoIoT.findFirst({
            where: { deviceId: deviceIdHeader, empresaId },
            select: { id: true }
          });
          dispositivoIoTId = dispositivo?.id ?? null;
          this.logger.log(`🔗 DispositivoIoTId resuelto: ${dispositivoIoTId}`);
        } catch (e) {
          this.logger.warn(`⚠️ No se pudo resolver dispositivo para deviceId=${deviceIdHeader}: ${e?.message || e}`);
        }
      }

      // 🔧 FORZAR: El sensor siempre se crea como activo desde ESP32
      createSensorDto.activo = true;
      this.logger.log(`🔧 Forzando sensor como activo: true`);

      // Validar que la empresa existe antes de crear el sensor
      this.logger.log(`🔍 Verificando que la empresa ${empresaId} existe...`);
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId }
      });
      if (!empresa) {
        this.logger.error(`❌ Empresa no encontrada: ${empresaId}`);
        throw new Error('Empresa no encontrada');
      }
      this.logger.log(`✅ Empresa encontrada: ${empresa.nombre}`);

      // Validar que la ubicación existe y pertenece a la empresa
      this.logger.log(`🔍 Verificando que la ubicación ${createSensorDto.ubicacionId} existe y pertenece a la empresa...`);
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: { 
          id: createSensorDto.ubicacionId, 
          empresaId: empresaId,
          activa: true
        }
      });
      if (!ubicacion) {
        this.logger.error(`❌ Ubicación no encontrada o no pertenece a la empresa: ${createSensorDto.ubicacionId} - Empresa: ${empresaId}`);
        throw new Error('Ubicación no encontrada o no pertenece a la empresa');
      }
      this.logger.log(`✅ Ubicación encontrada: ${ubicacion.nombre}`);

      // Regla de nombres duplicados: si ya existe un sensor con mismo nombre en la ubicación
      // y el dispositivo actual es distinto, generar un nombre único con sufijo "#n"
      try {
        const existente = await this.prisma.sensor.findFirst({
          where: { nombre: createSensorDto.nombre, ubicacionId: createSensorDto.ubicacionId, empresaId },
          select: { id: true, dispositivoIoTId: true }
        });
        if (existente && dispositivoIoTId && existente.dispositivoIoTId !== dispositivoIoTId) {
          const baseName = createSensorDto.nombre;
          createSensorDto.nombre = await this.generarNombreUnico(baseName, createSensorDto.ubicacionId, empresaId);
          this.logger.log(`🆕 Nombre duplicado detectado, usando nombre único: ${createSensorDto.nombre}`);
        }
      } catch (e) {
        this.logger.warn(`⚠️ No se pudo aplicar regla de nombre único: ${e?.message || e}`);
      }

      // Registrar sensor
      this.logger.log(`📝 Iniciando creación del sensor en la base de datos...`);
      this.logger.log(`📝 DTO final que se enviará al servicio: ${JSON.stringify(createSensorDto, null, 2)}`);
      
      const sensor = await this.sensoresService.registrarSensor(createSensorDto, empresaId);
      this.logger.log(`✅ Sensor registrado desde ESP32 exitosamente: ${sensor.nombre} (ID: ${sensor.id})`);
      
      // Vincular al dispositivo IoT si se resolvió y no está vinculado
      if (dispositivoIoTId && !sensor.dispositivoIoTId) {
        try {
          await this.prisma.sensor.update({
            where: { id: sensor.id },
            data: { dispositivoIoTId }
          });
          this.logger.log(`🔗 Sensor ${sensor.id} vinculado a dispositivo IoT ${dispositivoIoTId}`);
        } catch (e) {
          this.logger.warn(`⚠️ No se pudo vincular sensor ${sensor.id} a dispositivo ${dispositivoIoTId}: ${e?.message || e}`);
        }
      }
      this.logger.log(`🤖 ===== FIN REGISTRO SENSOR ESP32 EXITOSO =====`);
      
      return {
        success: true,
        message: 'Sensor registrado exitosamente',
        sensor: sensor,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ ===== ERROR EN REGISTRO SENSOR ESP32 =====`);
      this.logger.error(`❌ Error registrando sensor desde ESP32:`, error);
      this.logger.error(`📊 DTO recibido: ${JSON.stringify(createSensorDto, null, 2)}`);
      this.logger.error(`🌐 Headers: ${JSON.stringify(req.headers, null, 2)}`);
      this.logger.error(`🌐 URL: ${req.url}`);
      this.logger.error(`🌐 Método: ${req.method}`);
      this.logger.error(`❌ ===== FIN ERROR REGISTRO SENSOR ESP32 =====`);
      throw error;
    }
  }

  /**
   * Genera un nombre único agregando sufijo incremental "#n" evitando colisión en (nombre, ubicacionId)
   */
  private async generarNombreUnico(baseName: string, ubicacionId: number, empresaId: number): Promise<string> {
    const maxAttempts = 100;
    // Si el baseName ya termina en "#n", mantener la base sin el sufijo
    const base = baseName.replace(/\s#\d+$/, '');
    for (let i = 2; i < maxAttempts; i++) {
      const candidate = `${base} #${i}`;
      const exists = await this.prisma.sensor.findFirst({
        where: { nombre: candidate, ubicacionId, empresaId },
        select: { id: true }
      });
      if (!exists) return candidate;
    }
    // Fallback: timestamp corto
    const ts = Math.floor(Date.now() / 1000) % 100000;
    return `${base} #${ts}`;
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
