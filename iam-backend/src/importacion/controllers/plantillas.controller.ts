import { 
  Controller, 
  Get, 
  Param, 
  Res, 
  UseGuards, 
  Logger,
  HttpStatus,
  HttpException,
  Query
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { PlantillasGeneradorService } from '../services/plantillas-generador.service';
import { TipoImportacionUnificada } from '../dto/importacion-unificada.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Controller('plantillas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlantillasController {
  private readonly logger = new Logger(PlantillasController.name);

  constructor(
    private readonly plantillasGeneradorService: PlantillasGeneradorService
  ) {}

  /**
   * Obtiene la lista de tipos de plantillas disponibles
   */
  @Get()
  @Roles(Rol.ADMIN, Rol.SUPERADMIN, Rol.EMPLEADO)
  async obtenerTiposPlantillas() {
    try {
      this.logger.log('📋 Obteniendo tipos de plantillas disponibles');
      
      const plantillas = await this.plantillasGeneradorService.obtenerPlantillasDisponibles();
      
      return {
        success: true,
        data: plantillas,
        message: 'Tipos de plantillas obtenidos exitosamente'
      };
    } catch (error) {
      this.logger.error('Error obteniendo tipos de plantillas:', error);
      throw new HttpException(
        'Error interno del servidor al obtener plantillas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Genera y descarga una plantilla Excel para el tipo especificado
   */
  @Get(':tipo/descargar')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN, Rol.EMPLEADO)
  async descargarPlantilla(
    @Param('tipo') tipo: string,
    @Res() res: Response,
    @Query('version') version?: string
  ) {
    try {
      this.logger.log(`📥 Generando plantilla para descarga: ${tipo}`);

      // Validar tipo de plantilla
      if (!Object.values(TipoImportacionUnificada).includes(tipo as TipoImportacionUnificada)) {
        throw new HttpException(
          `Tipo de plantilla no válido: ${tipo}. Tipos válidos: ${Object.values(TipoImportacionUnificada).join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Generar plantilla
      const nombreArchivo = await this.plantillasGeneradorService.generarPlantilla(
        tipo as TipoImportacionUnificada
      );

      const rutaArchivo = this.plantillasGeneradorService.obtenerRutaPlantilla(nombreArchivo);

      // Verificar que el archivo existe
      try {
        await fs.access(rutaArchivo);
      } catch (error) {
        this.logger.error(`Archivo de plantilla no encontrado: ${rutaArchivo}`);
        throw new HttpException(
          'Error generando la plantilla',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Configurar headers para descarga
      const nombreDescarga = `plantilla_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreDescarga}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Leer el archivo y enviarlo
      const archivoBuffer = await fs.readFile(rutaArchivo);
      
      this.logger.log(`✅ Plantilla enviada: ${nombreDescarga}`);
      
      // Programar limpieza del archivo temporal después de enviarlo
      setTimeout(async () => {
        try {
          await fs.unlink(rutaArchivo);
          this.logger.log(`🗑️ Archivo temporal eliminado: ${nombreArchivo}`);
        } catch (error) {
          this.logger.warn(`No se pudo eliminar archivo temporal: ${nombreArchivo}`, error);
        }
      }, 60000); // Eliminar después de 1 minuto

      res.send(archivoBuffer);

    } catch (error) {
      this.logger.error(`Error descargando plantilla ${tipo}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor al generar la plantilla',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene información detallada sobre un tipo de plantilla específico
   */
  @Get(':tipo/info')
  @Roles(Rol.ADMIN, Rol.SUPERADMIN, Rol.EMPLEADO)
  async obtenerInfoPlantilla(@Param('tipo') tipo: string) {
    try {
      this.logger.log(`📖 Obteniendo información de plantilla: ${tipo}`);

      // Validar tipo de plantilla
      if (!Object.values(TipoImportacionUnificada).includes(tipo as TipoImportacionUnificada)) {
        throw new HttpException(
          `Tipo de plantilla no válido: ${tipo}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Obtener información específica según el tipo
      let info: any = {};

      switch (tipo as TipoImportacionUnificada) {
        case TipoImportacionUnificada.PRODUCTOS:
          info = {
            tipo: 'productos',
            nombre: 'Plantilla de Productos',
            descripcion: 'Para importar productos al inventario',
            columnasRequeridas: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
            columnasOpcionales: [
              'descripcion', 'stockMinimo', 'categoria', 'proveedor', 'codigoBarras', 
              'unidadMedida', 'ubicacion', 'fechaVencimiento', 'lote', 'notas',
              'sku', 'color', 'talla', 'tipoProducto', 'temperaturaOptima', 'humedadOptima'
            ],
            validaciones: [
              'nombre: Texto obligatorio, máximo 100 caracteres',
              'stock: Número entero no negativo',
              'precioCompra: Número decimal positivo',
              'precioVenta: Número decimal positivo'
            ],
            limites: {
              maxRegistros: 10000,
              maxTamanoArchivo: '50MB'
            }
          };
          break;

        case TipoImportacionUnificada.PROVEEDORES:
          info = {
            tipo: 'proveedores',
            nombre: 'Plantilla de Proveedores',
            descripcion: 'Para importar proveedores',
            columnasRequeridas: ['nombre'],
            columnasOpcionales: ['email', 'telefono', 'direccion', 'ciudad', 'pais', 'codigoPostal', 'ruc', 'contacto'],
            validaciones: [
              'nombre: Texto obligatorio, máximo 100 caracteres, único',
              'email: Formato de email válido (opcional)'
            ],
            limites: {
              maxRegistros: 5000,
              maxTamanoArchivo: '25MB'
            }
          };
          break;

        case TipoImportacionUnificada.MOVIMIENTOS:
          info = {
            tipo: 'movimientos',
            nombre: 'Plantilla de Movimientos',
            descripcion: 'Para importar movimientos de inventario',
            columnasRequeridas: ['fecha', 'tipo', 'producto', 'cantidad'],
            columnasOpcionales: ['motivo', 'precio', 'referencia', 'proveedor', 'notas'],
            validaciones: [
              'fecha: Formato YYYY-MM-DD obligatorio',
              'tipo: Debe ser "entrada", "salida" o "ajuste"',
              'cantidad: Número entero, puede ser negativo para ajustes'
            ],
            limites: {
              maxRegistros: 10000,
              maxTamanoArchivo: '50MB'
            }
          };
          break;

        default:
          throw new HttpException(
            'Tipo de plantilla no implementado',
            HttpStatus.NOT_IMPLEMENTED
          );
      }

      return {
        success: true,
        data: info,
        message: 'Información de plantilla obtenida exitosamente'
      };

    } catch (error) {
      this.logger.error(`Error obteniendo info de plantilla ${tipo}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Endpoint para limpiar plantillas antiguas (para mantenimiento)
   */
  @Get('admin/limpiar')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async limpiarPlantillasAntiguas(@Query('dias') dias?: string) {
    try {
      const diasMaximos = dias ? parseInt(dias) : 7;
      
      this.logger.log(`🧹 Iniciando limpieza de plantillas antiguas (${diasMaximos} días)`);
      
      await this.plantillasGeneradorService.limpiarPlantillasAntiguas(diasMaximos);
      
      return {
        success: true,
        message: `Limpieza completada. Plantillas anteriores a ${diasMaximos} días eliminadas.`
      };
    } catch (error) {
      this.logger.error('Error en limpieza de plantillas:', error);
      throw new HttpException(
        'Error en proceso de limpieza',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
