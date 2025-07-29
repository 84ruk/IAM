import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../../importacion/services/importacion-progress-tracker.service';
import { ImportacionWebSocketService } from '../../importacion/servicios/importacion-websocket.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo, ProveedorImportacion } from '../interfaces/trabajo-importacion.interface';
import { EnhancedBaseProcesadorService } from '../services/enhanced-base-procesador.service';
import { LoteProcesador } from '../interfaces/base-procesador.interface';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionProveedoresProcesador extends EnhancedBaseProcesadorService {
  constructor(
    prisma: PrismaService,
    cacheService: ImportacionCacheService,
    advancedLogging: AdvancedLoggingService,
    smartErrorResolver: SmartErrorResolverService,
    progressTracker: ImportacionProgressTrackerService,
    websocketService: ImportacionWebSocketService
  ) {
    super(
      prisma, 
      cacheService, 
      advancedLogging,
      smartErrorResolver,
      progressTracker,
      websocketService,
      'ImportacionProveedoresProcesador', 
      {
        loteSize: 100,
        maxRetries: 3,
        timeout: 30000,
        enableCache: true,
        cacheTTL: 1800,
      }
    );
  }

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const loteProcesador: LoteProcesador = {
      procesarLote: this.procesarLoteProveedores.bind(this),
      validarRegistro: this.validarRegistroProveedor.bind(this),
      guardarRegistro: this.guardarProveedor.bind(this),
    };

    return this.procesarArchivoBase(trabajo, job, loteProcesador);
  }

  protected obtenerCamposRequeridos(): string[] {
    return ['nombre', 'email', 'telefono', 'direccion'];
  }

  private validarEstructuraArchivo(datos: ProveedorImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = this.obtenerCamposRequeridos();

    if (datos.length === 0) {
      errores.push({
        fila: 1,
        columna: 'archivo',
        valor: '',
        mensaje: 'El archivo está vacío',
        tipo: 'validacion',
      });
      return errores;
    }

    // Verificar columnas requeridas en el primer registro
    const primerRegistro = datos[0];
    columnasRequeridas.forEach(columna => {
      if (!(columna in primerRegistro)) {
        errores.push({
          fila: 1,
          columna: 'estructura',
          valor: columna,
          mensaje: `Columna requerida no encontrada: ${columna}`,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  private async procesarLoteProveedores(
    lote: ProveedorImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job
  ): Promise<void> {
    for (const registro of lote) {
      try {
        // Validar registro
        const erroresValidacion = this.validarRegistroProveedor(registro);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Verificar si el proveedor ya existe
        const proveedorExistente = await this.verificarProveedorExistente(registro, trabajo.empresaId);
        if (proveedorExistente && !trabajo.opciones.sobrescribirExistentes) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'nombre',
            valor: String(registro.nombre),
            mensaje: `Proveedor "${String(registro.nombre)}" ya existe en la base de datos. Para sobrescribirlo, activa la opción "Sobrescribir existentes"`,
            tipo: 'duplicado',
          });
          resultado.estadisticas.duplicados++;
          continue;
        }

        // Guardar proveedor
        await this.guardarProveedor(registro, trabajo, proveedorExistente);
        resultado.estadisticas.exitosos++;

      } catch (error) {
        this.logger.error(`Error procesando proveedor en fila ${registro._filaOriginal}:`, error);
        resultado.errores.push({
          fila: registro._filaOriginal,
          columna: 'sistema',
          valor: '',
          mensaje: `Error del sistema: ${error.message}`,
          tipo: 'sistema',
        });
        resultado.estadisticas.errores++;
      }
    }
  }

  private validarRegistroProveedor(registro: ProveedorImportacion): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar nombre
    if (!registro.nombre || String(registro.nombre).trim().length === 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'nombre',
        valor: String(registro.nombre),
        mensaje: 'Nombre es requerido',
        tipo: 'validacion',
      });
    }

    // Validar email
    if (registro.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(registro.email))) {
        errores.push({
          fila: registro._filaOriginal,
          columna: 'email',
          valor: String(registro.email),
          mensaje: 'Formato de email inválido',
          tipo: 'validacion',
        });
      }
    }

    // Validar teléfono
    if (registro.telefono) {
      const telefonoRegex = /^[\d\s\-\+\(\)]+$/;
      if (!telefonoRegex.test(String(registro.telefono))) {
        errores.push({
          fila: registro._filaOriginal,
          columna: 'telefono',
          valor: String(registro.telefono),
          mensaje: 'Formato de teléfono inválido',
          tipo: 'validacion',
        });
      }
    }

    return errores;
  }

  private async verificarProveedorExistente(registro: ProveedorImportacion, empresaId: number): Promise<any> {
    return this.prisma.proveedor.findFirst({
      where: {
        nombre: String(registro.nombre).trim(),
        empresaId,
        estado: 'ACTIVO' as const,
      },
    });
  }

  private async guardarProveedor(registro: ProveedorImportacion, trabajo: TrabajoImportacion, proveedorExistente: any): Promise<void> {
    const datosProveedor = {
      nombre: String(registro.nombre).trim(),
      email: registro.email ? String(registro.email).trim() : null,
      telefono: registro.telefono ? String(registro.telefono).trim() : null,
      direccion: registro.direccion ? String(registro.direccion).trim() : null,
      empresaId: trabajo.empresaId,
      estado: 'ACTIVO' as const,
    };

    if (proveedorExistente && trabajo.opciones.sobrescribirExistentes) {
      // Actualizar proveedor existente
      await this.prisma.proveedor.update({
        where: { id: proveedorExistente.id },
        data: datosProveedor,
      });
    } else {
      // Crear nuevo proveedor
      await this.prisma.proveedor.create({
        data: datosProveedor,
      });
    }
  }
} 