import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface ErrorResolution {
  error: ErrorImportacion;
  resuelto: boolean;
  valorCorregido?: string;
  sugerencia?: string;
  accion: 'corregido' | 'sugerido' | 'ignorado' | 'requiere_intervencion';
  confianza: number; // 0-100
}

export interface DataCorrection {
  campo: string;
  valorOriginal: string;
  valorCorregido: string;
  tipoCorreccion: 'formato' | 'valor_por_defecto' | 'normalizacion' | 'validacion';
  confianza: number;
}

export interface SmartResolutionConfig {
  autoCorregirFormatos: boolean;
  usarValoresPorDefecto: boolean;
  normalizarDatos: boolean;
  nivelConfianzaMinimo: number;
  camposObligatorios: string[];
  valoresPorDefecto: Record<string, string>;
  patronesCorreccion: Record<string, RegExp>;
}

@Injectable()
export class SmartErrorResolverService {
  private readonly logger = new Logger(SmartErrorResolverService.name);

  private readonly configuracionesPorTipo: Record<string, SmartResolutionConfig> = {
    productos: {
      autoCorregirFormatos: true,
      usarValoresPorDefecto: true,
      normalizarDatos: true,
      nivelConfianzaMinimo: 70,
      camposObligatorios: ['nombre'],
      valoresPorDefecto: {
        stock: '0',
        precioCompra: '0',
        precioVenta: '0',
        stockMinimo: '0',
        descripcion: 'Sin descripción',
        categoria: 'Sin categoría',
        unidadMedida: 'unidad',
      },
      patronesCorreccion: {
        precio: /^[\d.,]+$/,
        stock: /^\d+$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        telefono: /^[\d\s\-\(\)\+]+$/,
      },
    },
    proveedores: {
      autoCorregirFormatos: true,
      usarValoresPorDefecto: true,
      normalizarDatos: true,
      nivelConfianzaMinimo: 80,
      camposObligatorios: ['nombre'],
      valoresPorDefecto: {
        email: 'sin-email@empresa.com',
        telefono: 'Sin teléfono',
        direccion: 'Sin dirección',
        ciudad: 'Sin ciudad',
      },
      patronesCorreccion: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        telefono: /^[\d\s\-\(\)\+]+$/,
      },
    },
    movimientos: {
      autoCorregirFormatos: true,
      usarValoresPorDefecto: true,
      normalizarDatos: true,
      nivelConfianzaMinimo: 75,
      camposObligatorios: ['fecha', 'tipo', 'producto', 'cantidad'],
      valoresPorDefecto: {
        precio: '0',
        motivo: 'Importación automática',
        referencia: 'SIN-REF',
        notas: 'Sin notas',
      },
      patronesCorreccion: {
        fecha: /^\d{4}-\d{2}-\d{2}$/,
        cantidad: /^\d+(\.\d+)?$/,
        precio: /^[\d.,]+$/,
      },
    },
  };

  /**
   * Resuelve errores de forma inteligente
   */
  resolverErrores(
    errores: ErrorImportacion[],
    tipoImportacion: string,
    datos: Record<string, unknown>
  ): {
    erroresResueltos: ErrorResolution[];
    correcciones: DataCorrection[];
    erroresSinResolver: ErrorImportacion[];
  } {
    const config = this.configuracionesPorTipo[tipoImportacion] || this.configuracionesPorTipo.productos;
    const erroresResueltos: ErrorResolution[] = [];
    const correcciones: DataCorrection[] = [];
    const erroresSinResolver: ErrorImportacion[] = [];

    for (const error of errores) {
      const resolucion = this.resolverErrorIndividual(error, config, datos);
      
      if (resolucion.resuelto && resolucion.confianza >= config.nivelConfianzaMinimo) {
        erroresResueltos.push(resolucion);
        
        if (resolucion.valorCorregido) {
          correcciones.push({
            campo: error.columna,
            valorOriginal: error.valor,
            valorCorregido: resolucion.valorCorregido,
            tipoCorreccion: this.determinarTipoCorreccion(error, resolucion),
            confianza: resolucion.confianza,
          });
        }
      } else {
        erroresSinResolver.push(error);
      }
    }

    this.logger.log(`Resolución inteligente completada: ${erroresResueltos.length} resueltos, ${erroresSinResolver.length} sin resolver`);

    return {
      erroresResueltos,
      correcciones,
      erroresSinResolver,
    };
  }

  /**
   * Resuelve un error individual
   */
  private resolverErrorIndividual(
    error: ErrorImportacion,
    config: SmartResolutionConfig,
    datos: Record<string, unknown>
  ): ErrorResolution {
    const resolucion: ErrorResolution = {
      error,
      resuelto: false,
      accion: 'requiere_intervencion',
      confianza: 0,
    };

    // Intentar corrección de formato
    if (config.autoCorregirFormatos) {
      const correccionFormato = this.corregirFormato(error, config);
      if (correccionFormato) {
        resolucion.resuelto = true;
        resolucion.valorCorregido = correccionFormato.valor;
        resolucion.confianza = correccionFormato.confianza;
        resolucion.accion = 'corregido';
        resolucion.sugerencia = `Formato corregido automáticamente: ${error.valor} → ${correccionFormato.valor}`;
        return resolucion;
      }
    }

    // Usar valor por defecto si está disponible
    if (config.usarValoresPorDefecto && config.valoresPorDefecto[error.columna]) {
      resolucion.resuelto = true;
      resolucion.valorCorregido = config.valoresPorDefecto[error.columna];
      resolucion.confianza = 90;
      resolucion.accion = 'corregido';
      resolucion.sugerencia = `Valor por defecto aplicado: ${config.valoresPorDefecto[error.columna]}`;
      return resolucion;
    }

    // Generar sugerencia si no se puede resolver
    resolucion.sugerencia = this.generarSugerencia(error, config);
    resolucion.confianza = 0;

    return resolucion;
  }

  /**
   * Corrige formato de datos
   */
  private corregirFormato(error: ErrorImportacion, config: SmartResolutionConfig): { valor: string; confianza: number } | null {
    const valor = String(error.valor).trim();
    
    // Corrección de precios
    if (error.columna.includes('precio') && config.patronesCorreccion.precio) {
      const precioCorregido = this.corregirPrecio(valor);
      if (precioCorregido) {
        return { valor: precioCorregido, confianza: 85 };
      }
    }

    // Corrección de fechas
    if (error.columna.includes('fecha') && config.patronesCorreccion.fecha) {
      const fechaCorregida = this.corregirFecha(valor);
      if (fechaCorregida) {
        return { valor: fechaCorregida, confianza: 80 };
      }
    }

    // Corrección de emails
    if (error.columna.includes('email') && config.patronesCorreccion.email) {
      const emailCorregido = this.corregirEmail(valor);
      if (emailCorregido) {
        return { valor: emailCorregido, confianza: 75 };
      }
    }

    // Corrección de teléfonos
    if (error.columna.includes('telefono') && config.patronesCorreccion.telefono) {
      const telefonoCorregido = this.corregirTelefono(valor);
      if (telefonoCorregido) {
        return { valor: telefonoCorregido, confianza: 70 };
      }
    }

    // Normalización de texto
    if (error.columna.includes('nombre') || error.columna.includes('descripcion')) {
      const textoNormalizado = this.normalizarTexto(valor);
      if (textoNormalizado !== valor) {
        return { valor: textoNormalizado, confianza: 60 };
      }
    }

    return null;
  }

  /**
   * Corrige formato de precio
   */
  private corregirPrecio(valor: string): string | null {
    // Remover caracteres no numéricos excepto punto y coma
    let precio = valor.replace(/[^\d.,]/g, '');
    
    // Convertir coma a punto si es necesario
    if (precio.includes(',') && !precio.includes('.')) {
      precio = precio.replace(',', '.');
    }
    
    // Validar que sea un número válido
    const numero = parseFloat(precio);
    if (!isNaN(numero) && numero >= 0) {
      return numero.toFixed(2);
    }
    
    return null;
  }

  /**
   * Corrige formato de fecha
   */
  private corregirFecha(valor: string): string | null {
    // Intentar diferentes formatos de fecha
    const formatos = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    ];

    for (const formato of formatos) {
      const match = valor.match(formato);
      if (match) {
        const [, dia, mes, año] = match;
        const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        if (!isNaN(fecha.getTime())) {
          return fecha.toISOString().split('T')[0];
        }
      }
    }

    return null;
  }

  /**
   * Corrige formato de email
   */
  private corregirEmail(valor: string): string | null {
    const email = valor.toLowerCase().trim();
    
    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return email;
    }
    
    return null;
  }

  /**
   * Corrige formato de teléfono
   */
  private corregirTelefono(valor: string): string | null {
    // Remover caracteres no numéricos
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros.length >= 7 && numeros.length <= 15) {
      return numeros;
    }
    
    return null;
  }

  /**
   * Normaliza texto
   */
  private normalizarTexto(valor: string): string {
    return valor
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.,!?-]/g, '') // Remover caracteres especiales
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar primera letra de cada palabra
  }

  /**
   * Determina el tipo de corrección
   */
  private determinarTipoCorreccion(error: ErrorImportacion, resolucion: ErrorResolution): DataCorrection['tipoCorreccion'] {
    if (resolucion.valorCorregido === this.configuracionesPorTipo.productos.valoresPorDefecto[error.columna]) {
      return 'valor_por_defecto';
    }
    
    if (error.columna.includes('precio') || error.columna.includes('fecha') || error.columna.includes('email')) {
      return 'formato';
    }
    
    if (error.columna.includes('nombre') || error.columna.includes('descripcion')) {
      return 'normalizacion';
    }
    
    return 'validacion';
  }

  /**
   * Genera sugerencia para errores no resueltos
   */
  private generarSugerencia(error: ErrorImportacion, config: SmartResolutionConfig): string {
    const sugerencias: Record<string, string> = {
      nombre: 'El nombre es obligatorio y debe tener al menos 2 caracteres',
      email: 'El email debe tener un formato válido (ejemplo@dominio.com)',
      telefono: 'El teléfono debe contener solo números y puede incluir espacios, guiones o paréntesis',
      precio: 'El precio debe ser un número mayor o igual a 0',
      stock: 'El stock debe ser un número entero mayor o igual a 0',
      fecha: 'La fecha debe estar en formato YYYY-MM-DD',
      cantidad: 'La cantidad debe ser un número mayor a 0',
    };

    return sugerencias[error.columna] || `Verificar el valor del campo "${error.columna}"`;
  }

  /**
   * Aplica correcciones a los datos
   */
  aplicarCorrecciones(datos: Record<string, unknown>[], correcciones: DataCorrection[]): Record<string, unknown>[] {
    const datosCorregidos = [...datos];
    
    for (const correccion of correcciones) {
      for (const registro of datosCorregidos) {
        if (registro[correccion.campo] === correccion.valorOriginal) {
          registro[correccion.campo] = correccion.valorCorregido;
        }
      }
    }
    
    return datosCorregidos;
  }

  /**
   * Genera reporte de correcciones
   */
  generarReporteCorrecciones(correcciones: DataCorrection[]): {
    totalCorrecciones: number;
    correccionesPorTipo: Record<string, number>;
    camposMasCorregidos: Array<{ campo: string; cantidad: number }>;
    confianzaPromedio: number;
  } {
    const correccionesPorTipo: Record<string, number> = {};
    const camposCorregidos: Record<string, number> = {};
    let confianzaTotal = 0;

    for (const correccion of correcciones) {
      correccionesPorTipo[correccion.tipoCorreccion] = 
        (correccionesPorTipo[correccion.tipoCorreccion] || 0) + 1;
      
      camposCorregidos[correccion.campo] = 
        (camposCorregidos[correccion.campo] || 0) + 1;
      
      confianzaTotal += correccion.confianza;
    }

    const camposMasCorregidos = Object.entries(camposCorregidos)
      .map(([campo, cantidad]) => ({ campo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return {
      totalCorrecciones: correcciones.length,
      correccionesPorTipo,
      camposMasCorregidos,
      confianzaPromedio: correcciones.length > 0 ? Math.round(confianzaTotal / correcciones.length) : 0,
    };
  }
} 