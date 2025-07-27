import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion,
  RegistroImportacion,
  ProveedorImportacion 
} from '../../../colas/interfaces/trabajo-importacion.interface';
import { EstrategiaImportacion, ContextoValidacion } from './base-estrategia.interface';

@Injectable()
export class ProveedoresEstrategia implements EstrategiaImportacion {
  readonly tipo = 'proveedores';
  readonly nombre = 'Estrategia de Importación de Proveedores';
  
  private readonly logger = new Logger(ProveedoresEstrategia.name);

  constructor(private readonly prisma: PrismaService) {}

  validarEstructuraArchivo(datos: RegistroImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = this.obtenerColumnasRequeridas();

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

  validarRegistro(registro: RegistroImportacion, contexto?: ContextoValidacion): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const proveedor = registro as ProveedorImportacion;

    // Validaciones básicas
    if (!proveedor.nombre || String(proveedor.nombre).trim() === '') {
      errores.push({
        fila: proveedor._filaOriginal,
        columna: 'nombre',
        valor: String(proveedor.nombre),
        mensaje: 'El nombre del proveedor es requerido',
        tipo: 'validacion',
      });
    }

    // Validación de email si está presente
    if (proveedor.email && String(proveedor.email).trim() !== '') {
      const email = String(proveedor.email).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        errores.push({
          fila: proveedor._filaOriginal,
          columna: 'email',
          valor: email,
          mensaje: 'El formato del email no es válido',
          tipo: 'validacion',
        });
      }
    }

    // Validación de teléfono si está presente
    if (proveedor.telefono && String(proveedor.telefono).trim() !== '') {
      const telefono = String(proveedor.telefono).trim();
      
      // Validación básica de teléfono (al menos 7 dígitos)
      if (telefono.replace(/\D/g, '').length < 7) {
        errores.push({
          fila: proveedor._filaOriginal,
          columna: 'telefono',
          valor: telefono,
          mensaje: 'El teléfono debe tener al menos 7 dígitos',
          tipo: 'validacion',
        });
      }
    }

    // Validaciones específicas según configuración
    if (contexto?.configuracion) {
      const config = contexto.configuracion;
      
      if (config.validarEmail && proveedor.email && String(proveedor.email).trim() === '') {
        errores.push({
          fila: proveedor._filaOriginal,
          columna: 'email',
          valor: String(proveedor.email),
          mensaje: 'El email es requerido según la configuración',
          tipo: 'validacion',
        });
      }
      
      if (config.validarTelefono && proveedor.telefono && String(proveedor.telefono).trim() === '') {
        errores.push({
          fila: proveedor._filaOriginal,
          columna: 'telefono',
          valor: String(proveedor.telefono),
          mensaje: 'El teléfono es requerido según la configuración',
          tipo: 'validacion',
        });
      }
    }

    return errores;
  }

  async transformarDatos(datos: RegistroImportacion[]): Promise<RegistroImportacion[]> {
    return datos.map(registro => {
      const proveedor = registro as ProveedorImportacion;
      
      // Normalizar datos
      return {
        ...proveedor,
        nombre: String(proveedor.nombre).trim(),
        email: proveedor.email ? String(proveedor.email).trim().toLowerCase() : null,
        telefono: proveedor.telefono ? this.normalizarTelefono(String(proveedor.telefono)) : null,
      };
    });
  }

  async verificarExistencia(registro: RegistroImportacion, empresaId: number): Promise<any> {
    const proveedor = registro as ProveedorImportacion;
    
    // Buscar por nombre (normalizado)
    const nombreNormalizado = String(proveedor.nombre).toLowerCase().trim();
    
    const existente = await this.prisma.proveedor.findFirst({
      where: {
        empresaId,
        OR: [
          { nombre: { equals: nombreNormalizado, mode: 'insensitive' } },
          { email: proveedor.email ? String(proveedor.email).toLowerCase() : undefined },
        ],
      },
    });

    return existente;
  }

  async guardarRegistro(registro: RegistroImportacion, trabajo: TrabajoImportacion, existente: any): Promise<void> {
    const proveedor = registro as ProveedorImportacion;
    
    // Solo incluir campos que existen en el modelo de Prisma
    const datosProveedor = {
      nombre: String(proveedor.nombre).trim(),
      email: proveedor.email ? String(proveedor.email).trim().toLowerCase() : null,
      telefono: proveedor.telefono ? this.normalizarTelefono(String(proveedor.telefono)) : null,
      empresaId: trabajo.empresaId,
    };

    if (existente && trabajo.opciones.sobrescribirExistentes) {
      await this.prisma.proveedor.update({
        where: { id: existente.id },
        data: datosProveedor,
      });
    } else if (!existente) {
      await this.prisma.proveedor.create({
        data: datosProveedor,
      });
    }
  }

  obtenerConfiguracionProcesamiento() {
    return {
      loteSize: 50,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
    };
  }

  obtenerColumnasRequeridas(): string[] {
    return ['nombre'];
  }

  obtenerColumnasOpcionales(): string[] {
    return ['email', 'telefono'];
  }

  obtenerValidacionesEspecificas(): any[] {
    return [
      { campo: 'nombre', tipo: 'requerido', mensaje: 'El nombre del proveedor es requerido' },
      { campo: 'email', tipo: 'email', mensaje: 'El formato del email no es válido' },
      { campo: 'telefono', tipo: 'formato', condicion: 'telefono', mensaje: 'El formato del teléfono no es válido' },
    ];
  }

  async procesarLote(
    lote: RegistroImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job,
    contexto?: ContextoValidacion
  ): Promise<void> {
    const maxRetries = this.obtenerConfiguracionProcesamiento().maxRetries;

    for (const registro of lote) {
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          // Validar registro
          const erroresValidacion = this.validarRegistro(registro, contexto);
          if (erroresValidacion.length > 0) {
            resultado.errores.push(...erroresValidacion);
            resultado.estadisticas.errores++;
            break;
          }

          // Verificar existencia
          const existente = await this.verificarExistencia(registro, trabajo.empresaId);
          if (existente && !trabajo.opciones.sobrescribirExistentes) {
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'nombre',
              valor: String((registro as ProveedorImportacion).nombre),
              mensaje: 'Proveedor ya existe y no se permite sobrescribir',
              tipo: 'duplicado',
            });
            resultado.estadisticas.duplicados++;
            break;
          }

          // Guardar registro
          await this.guardarRegistro(registro, trabajo, existente);
          
          resultado.estadisticas.exitosos++;
          success = true;

        } catch (error) {
          retryCount++;
          this.logger.warn(`Error procesando proveedor (intento ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
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
    }
  }

  private normalizarTelefono(telefono: string): string {
    // Remover todos los caracteres no numéricos
    let numero = telefono.replace(/\D/g, '');
    
    // Si empieza con 0, removerlo
    if (numero.startsWith('0')) {
      numero = numero.substring(1);
    }
    
    // Si empieza con +52 (México), removerlo
    if (numero.startsWith('52')) {
      numero = numero.substring(2);
    }
    
    // Formatear como (XXX) XXX-XXXX
    if (numero.length === 10) {
      return `(${numero.substring(0, 3)}) ${numero.substring(3, 6)}-${numero.substring(6)}`;
    }
    
    // Si no tiene el formato correcto, devolver el original limpio
    return numero;
  }
} 