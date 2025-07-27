import { Controller, Get, Param, Query, Res, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { PlantillasAutoService, PlantillaInfo } from './servicios/plantillas-auto.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Plantillas Automáticas')
@Controller('plantillas-auto')
@Public()
export class PlantillasAutoController {
  private readonly logger = new Logger(PlantillasAutoController.name);

  constructor(private readonly plantillasAutoService: PlantillasAutoService) {}

  /**
   * Obtiene todas las plantillas disponibles organizadas por tipo
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las plantillas disponibles organizadas por tipo' })
  @ApiResponse({ status: 200, description: 'Plantillas obtenidas correctamente' })
  async obtenerTodasLasPlantillas() {
    try {
      const plantillas = await this.plantillasAutoService.obtenerTodasLasPlantillas();
      
      return {
        success: true,
        message: 'Plantillas obtenidas correctamente',
        data: {
          total: this.contarTotalPlantillas(plantillas),
          productos: {
            cantidad: plantillas.productos.length,
            plantillas: plantillas.productos.map(p => this.sanitizarPlantillaInfo(p))
          },
          proveedores: {
            cantidad: plantillas.proveedores.length,
            plantillas: plantillas.proveedores.map(p => this.sanitizarPlantillaInfo(p))
          },
          movimientos: {
            cantidad: plantillas.movimientos.length,
            plantillas: plantillas.movimientos.map(p => this.sanitizarPlantillaInfo(p))
          },
          otros: {
            cantidad: plantillas.otros.length,
            plantillas: plantillas.otros.map(p => this.sanitizarPlantillaInfo(p))
          }
        }
      };
    } catch (error) {
      this.logger.error('Error obteniendo plantillas:', error);
      throw new BadRequestException('Error obteniendo plantillas');
    }
  }

  /**
   * Obtiene estadísticas de plantillas
   */
  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de plantillas' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas correctamente' })
  async obtenerEstadisticas() {
    try {
      const plantillas = await this.plantillasAutoService.obtenerTodasLasPlantillas();
      
      const estadisticas = {
        total: this.contarTotalPlantillas(plantillas),
        porTipo: {
          productos: plantillas.productos.length,
          proveedores: plantillas.proveedores.length,
          movimientos: plantillas.movimientos.length,
          otros: plantillas.otros.length
        },
        porCategoria: {
          avanzadas: this.contarPlantillasPorCategoria(plantillas, 'avanzada'),
          mejoradas: this.contarPlantillasPorCategoria(plantillas, 'mejorada'),
          estandar: this.contarPlantillasPorCategoria(plantillas, 'estandar')
        },
        tamañoTotal: this.calcularTamañoTotal(plantillas),
        ultimaActualizacion: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Estadísticas obtenidas correctamente',
        data: estadisticas
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas:', error);
      throw new BadRequestException('Error obteniendo estadísticas');
    }
  }

  /**
   * Busca plantillas por criterios
   */
  @Get('buscar')
  @ApiOperation({ summary: 'Buscar plantillas por criterios específicos' })
  @ApiResponse({ status: 200, description: 'Plantillas encontradas correctamente' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de plantilla' })
  @ApiQuery({ name: 'nombre', required: false, description: 'Nombre de la plantilla' })
  @ApiQuery({ name: 'incluirAvanzadas', required: false, description: 'Incluir plantillas avanzadas' })
  @ApiQuery({ name: 'incluirMejoradas', required: false, description: 'Incluir plantillas mejoradas' })
  async buscarPlantillas(
    @Query('tipo') tipo?: string,
    @Query('nombre') nombre?: string,
    @Query('incluirAvanzadas') incluirAvanzadas?: string,
    @Query('incluirMejoradas') incluirMejoradas?: string
  ) {
    try {
      const criterios = {
        tipo,
        nombre,
        incluirAvanzadas: incluirAvanzadas === 'true',
        incluirMejoradas: incluirMejoradas === 'true'
      };

      const plantillas = await this.plantillasAutoService.buscarPlantillas(criterios);
      
      return {
        success: true,
        message: 'Búsqueda completada correctamente',
        data: {
          criterios,
          cantidad: plantillas.length,
          plantillas: plantillas.map(p => this.sanitizarPlantillaInfo(p))
        }
      };
    } catch (error) {
      this.logger.error('Error buscando plantillas:', error);
      throw new BadRequestException('Error buscando plantillas');
    }
  }

  /**
   * Actualiza la información de plantillas
   */
  @Get('actualizar')
  @ApiOperation({ summary: 'Actualizar información de plantillas' })
  @ApiResponse({ status: 200, description: 'Plantillas actualizadas correctamente' })
  async actualizarPlantillas() {
    try {
      await this.plantillasAutoService.actualizarPlantillas();
      
      return {
        success: true,
        message: 'Información de plantillas actualizada correctamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error actualizando plantillas:', error);
      throw new BadRequestException('Error actualizando plantillas');
    }
  }

  /**
   * Obtiene las plantillas disponibles para un tipo específico
   */
  @Get(':tipo')
  @ApiOperation({ summary: 'Obtener plantillas disponibles para un tipo específico' })
  @ApiResponse({ status: 200, description: 'Plantillas del tipo obtenidas correctamente' })
  async obtenerPlantillasPorTipo(@Param('tipo') tipo: string) {
    try {
      if (!['productos', 'proveedores', 'movimientos'].includes(tipo)) {
        throw new BadRequestException('Tipo de plantilla no válido');
      }

      const plantillas = await this.plantillasAutoService.obtenerPlantillasPorTipo(tipo as any);
      
      return {
        success: true,
        message: `Plantillas de ${tipo} obtenidas correctamente`,
        data: {
          tipo,
          cantidad: plantillas.length,
          plantillas: plantillas.map(p => this.sanitizarPlantillaInfo(p))
        }
      };
    } catch (error) {
      this.logger.error(`Error obteniendo plantillas de ${tipo}:`, error);
      throw new BadRequestException(`Error obteniendo plantillas de ${tipo}`);
    }
  }

  /**
   * Obtiene la mejor plantilla disponible para un tipo
   */
  @Get(':tipo/mejor')
  @ApiOperation({ summary: 'Obtener la mejor plantilla disponible para un tipo' })
  @ApiResponse({ status: 200, description: 'Mejor plantilla obtenida correctamente' })
  async obtenerMejorPlantilla(@Param('tipo') tipo: string) {
    try {
      if (!['productos', 'proveedores', 'movimientos'].includes(tipo)) {
        throw new BadRequestException('Tipo de plantilla no válido');
      }

      const plantilla = await this.plantillasAutoService.obtenerMejorPlantilla(tipo as any);
      
      if (!plantilla) {
        return {
          success: false,
          message: `No se encontraron plantillas para ${tipo}`,
          data: null
        };
      }

      return {
        success: true,
        message: `Mejor plantilla de ${tipo} obtenida correctamente`,
        data: this.sanitizarPlantillaInfo(plantilla)
      };
    } catch (error) {
      this.logger.error(`Error obteniendo mejor plantilla de ${tipo}:`, error);
      throw new BadRequestException(`Error obteniendo mejor plantilla de ${tipo}`);
    }
  }

  /**
   * Descarga una plantilla específica
   */
  @Get(':tipo/descargar/:nombre')
  @ApiOperation({ summary: 'Descargar una plantilla específica' })
  @ApiResponse({ status: 200, description: 'Plantilla descargada correctamente' })
  async descargarPlantilla(
    @Param('tipo') tipo: string,
    @Param('nombre') nombre: string,
    @Res() res: Response
  ) {
    try {
      if (!['productos', 'proveedores', 'movimientos'].includes(tipo)) {
        throw new BadRequestException('Tipo de plantilla no válido');
      }

      // Verificar que la plantilla existe
      const existe = await this.plantillasAutoService.plantillaExiste(nombre);
      if (!existe) {
        throw new BadRequestException('Plantilla no encontrada');
      }

      // Obtener información de la plantilla
      const infoPlantilla = await this.plantillasAutoService.obtenerInfoPlantilla(nombre);
      if (!infoPlantilla) {
        throw new BadRequestException('Información de plantilla no disponible');
      }

      // Verificar que el archivo existe físicamente
      if (!fs.existsSync(infoPlantilla.ruta)) {
        throw new BadRequestException('Archivo de plantilla no encontrado');
      }

      // Configurar headers de descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
      res.setHeader('Content-Length', infoPlantilla.tamaño.toString());

      // Enviar archivo
      const stream = fs.createReadStream(infoPlantilla.ruta);
      stream.pipe(res);

      this.logger.log(`✅ Plantilla ${nombre} descargada correctamente`);

    } catch (error) {
      this.logger.error(`Error descargando plantilla ${nombre}:`, error);
      throw new BadRequestException(`Error descargando plantilla: ${error.message}`);
    }
  }

  /**
   * Obtiene información detallada de una plantilla específica
   */
  @Get('info/:nombre')
  @ApiOperation({ summary: 'Obtener información detallada de una plantilla específica' })
  @ApiResponse({ status: 200, description: 'Información de plantilla obtenida correctamente' })
  async obtenerInfoPlantilla(@Param('nombre') nombre: string) {
    try {
      const infoPlantilla = await this.plantillasAutoService.obtenerInfoPlantilla(nombre);
      
      if (!infoPlantilla) {
        return {
          success: false,
          message: 'Plantilla no encontrada',
          data: null
        };
      }

      return {
        success: true,
        message: 'Información de plantilla obtenida correctamente',
        data: this.sanitizarPlantillaInfo(infoPlantilla)
      };
    } catch (error) {
      this.logger.error(`Error obteniendo información de plantilla ${nombre}:`, error);
      throw new BadRequestException(`Error obteniendo información de plantilla`);
    }
  }

  /**
   * Sanitiza la información de una plantilla para la respuesta
   */
  private sanitizarPlantillaInfo(plantilla: PlantillaInfo) {
    return {
      nombre: plantilla.nombre,
      tipo: plantilla.tipo,
      descripcion: plantilla.descripcion,
      tamaño: plantilla.tamaño,
      fechaModificacion: plantilla.fechaModificacion,
      // No incluir la ruta por seguridad
    };
  }

  /**
   * Cuenta el total de plantillas
   */
  private contarTotalPlantillas(plantillas: any): number {
    return plantillas.productos.length + 
           plantillas.proveedores.length + 
           plantillas.movimientos.length + 
           plantillas.otros.length;
  }

  /**
   * Cuenta plantillas por categoría
   */
  private contarPlantillasPorCategoria(plantillas: any, categoria: string): number {
    const todasLasPlantillas = [
      ...plantillas.productos,
      ...plantillas.proveedores,
      ...plantillas.movimientos,
      ...plantillas.otros
    ];

    return todasLasPlantillas.filter(p => p.nombre.toLowerCase().includes(categoria)).length;
  }

  /**
   * Calcula el tamaño total de todas las plantillas
   */
  private calcularTamañoTotal(plantillas: any): number {
    const todasLasPlantillas = [
      ...plantillas.productos,
      ...plantillas.proveedores,
      ...plantillas.movimientos,
      ...plantillas.otros
    ];

    return todasLasPlantillas.reduce((total, p) => total + p.tamaño, 0);
  }
} 