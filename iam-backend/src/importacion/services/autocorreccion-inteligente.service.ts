import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface CorreccionOrtografica {
  palabraOriginal: string;
  palabraCorregida: string;
  confianza: number;
  tipo: 'ortografia' | 'acentos' | 'mayusculas' | 'abreviacion' | 'sinonimo' | 'normalizacion';
  sugerencias: string[];
}

export interface CorreccionCampo {
  campo: string;
  valorOriginal: string;
  valorCorregido: string;
  tipoCorreccion: 'ortografia' | 'formato' | 'normalizacion' | 'validacion' | 'sugerencia';
  confianza: number;
  explicacion: string;
  sugerencias: string[];
}

export interface ConfiguracionAutocorreccion {
  habilitarOrtografia: boolean;
  habilitarNormalizacion: boolean;
  habilitarSugerencias: boolean;
  nivelConfianzaMinimo: number;
  idioma: 'es' | 'en';
  camposEspecificos: Record<string, {
    correccionOrtografica: boolean;
    normalizacion: boolean;
    sugerencias: boolean;
  }>;
}

@Injectable()
export class AutocorreccionInteligenteService {
  private readonly logger = new Logger(AutocorreccionInteligenteService.name);

  // Cache para mejorar rendimiento
  private readonly cacheCorrecciones = new Map<string, string>();
  private readonly cacheSinonimos = new Map<string, string[]>();

  // Diccionario de palabras comunes en español para corrección ortográfica
  private readonly diccionarioEspanol = new Set([
    // Productos comunes
    'producto', 'productos', 'mercancia', 'mercancía', 'articulo', 'artículo',
    'inventario', 'stock', 'almacen', 'almacén', 'bodega', 'deposito', 'depósito',
    
    // Tipos de productos
    'electronico', 'electrónico', 'medicamento', 'alimento', 'ropa', 'herramienta',
    'equipo', 'maquinaria', 'repuesto', 'accesorio', 'consumible', 'material',
    
    // Unidades de medida
    'unidad', 'unidades', 'kilogramo', 'kilogramos', 'litro', 'litros', 'metro',
    'metros', 'gramo', 'gramos', 'mililitro', 'mililitros', 'centimetro', 'centímetro',
    'centimetros', 'centímetros', 'caja', 'cajas', 'paquete', 'paquetes', 'licencia',
    
    // Estados y categorías
    'activo', 'activos', 'inactivo', 'inactivos', 'disponible', 'agotado', 'pendiente',
    'completado', 'cancelado', 'procesando', 'enviado', 'recibido', 'devuelto',
    
    // Proveedores
    'proveedor', 'proveedores', 'distribuidor', 'distribuidores', 'fabricante',
    'fabricantes', 'importador', 'importadores', 'exportador', 'exportadores',
    
    // Movimientos
    'entrada', 'entradas', 'salida', 'salidas', 'transferencia', 'transferencias',
    'ajuste', 'ajustes', 'inventario', 'conteo', 'conteos', 'merma', 'mermas',
    
    // Ubicaciones
    'estante', 'estantes', 'pasillo', 'pasillos', 'nivel', 'niveles', 'seccion',
    'sección', 'secciones', 'area', 'área', 'areas', 'áreas', 'zona', 'zonas',
    
    // Características
    'color', 'colores', 'talla', 'tallas', 'marca', 'marcas', 'modelo', 'modelos',
    'version', 'versión', 'versiones', 'serie', 'series', 'lote', 'lotes',
    
    // Medidas y cantidades
    'cantidad', 'cantidades', 'precio', 'precios', 'costo', 'costos', 'valor',
    'valores', 'total', 'totales', 'suma', 'sumas', 'promedio', 'promedios',
    
    // Tiempo
    'fecha', 'fechas', 'hora', 'horas', 'dia', 'día', 'dias', 'días', 'semana',
    'semanas', 'mes', 'meses', 'año', 'años', 'periodo', 'período', 'periodos',
    
    // Acciones
    'crear', 'creado', 'actualizar', 'actualizado', 'eliminar', 'eliminado',
    'procesar', 'procesado', 'validar', 'validado', 'verificar', 'verificado',
    'revisar', 'revisado', 'aprobar', 'aprobado', 'rechazar', 'rechazado',
    
    // Errores comunes
    'error', 'errores', 'problema', 'problemas', 'inconveniente', 'inconvenientes',
    'dificultad', 'dificultades', 'conflicto', 'conflictos', 'solicitud', 'solicitudes',
    
    // Palabras técnicas
    'sistema', 'sistemas', 'aplicacion', 'aplicación', 'aplicaciones', 'programa',
    'programas', 'software', 'hardware', 'servidor', 'servidores', 'cliente',
    'clientes', 'usuario', 'usuarios', 'administrador', 'administradores',
    
    // Conectores y preposiciones
    'para', 'por', 'con', 'sin', 'sobre', 'bajo', 'entre', 'desde', 'hasta',
    'durante', 'antes', 'después', 'mientras', 'cuando', 'donde', 'como', 'que',
  ]);

  // Diccionario de errores comunes y sus correcciones
  private readonly erroresComunes: Record<string, string> = {
    // Errores de acentuación
    'electronico': 'electrónico',
    'medicamento': 'medicamento',
    'centimetro': 'centímetro',
    'centimetros': 'centímetros',
    'almacen': 'almacén',
    'deposito': 'depósito',
    'mercancia': 'mercancía',
    'articulo': 'artículo',
    'seccion': 'sección',
    'area': 'área',
    'areas': 'áreas',
    'version': 'versión',
    'dia': 'día',
    'dias': 'días',
    'periodo': 'período',
    'periodos': 'períodos',
    'aplicacion': 'aplicación',
    'aplicaciones': 'aplicaciones',
    
    // Abreviaciones comunes
    'prod': 'producto',
    'prov': 'proveedor',
    'mov': 'movimiento',
    'inv': 'inventario',
    'alm': 'almacén',
    'cat': 'categoría',
    'prec': 'precio',
    'cant': 'cantidad',
    'fech': 'fecha',
    'estado': 'estado',
    'activo': 'activo',
    'inact': 'inactivo',
    'pend': 'pendiente',
    'comp': 'completado',
    'procesando': 'procesando',
    'env': 'enviado',
    'recibido': 'recibido',
    'dev': 'devuelto',
    'ent': 'entrada',
    'sal': 'salida',
    'tra': 'transferencia',
    'aju': 'ajuste',
    'conteo': 'conteo',
    'mer': 'merma',
    'estante': 'estante',
    'pas': 'pasillo',
    'niv': 'nivel',
    'zon': 'zona',
    'col': 'color',
    'tal': 'talla',
    'mar': 'marca',
    'mod': 'modelo',
    'ser': 'serie',
    'lot': 'lote',
    'cantidad': 'cantidad',
    'precio': 'precio',
    'cos': 'costo',
    'valor': 'valor',
    'tot': 'total',
    'sum': 'suma',
    'prom': 'promedio',
    'fecha': 'fecha',
    'hor': 'hora',
    'sem': 'semana',
    'mes': 'mes',
    'año': 'año',
    'per': 'período',
    'cre': 'crear',
    'actualizar': 'actualizar',
    'eli': 'eliminar',
    'procesar': 'procesar',
    'validar': 'validar',
    'verificar': 'verificar',
    'rev': 'revisar',
    'apr': 'aprobar',
    'rechazar': 'rechazar',
    'err': 'error',
    'prob': 'problema',
    'dif': 'dificultad',
    'conf': 'conflicto',
    'sol': 'solicitud',
    'sis': 'sistema',
    'apl': 'aplicación',
    'prog': 'programa',
    'sof': 'software',
    'har': 'hardware',
    'servidor': 'servidor',
    'cli': 'cliente',
    'usu': 'usuario',
    'adm': 'administrador',
  };

  // Sinónimos para sugerencias
  private readonly sinonimos: Record<string, string[]> = {
    'producto': ['artículo', 'mercancía', 'item', 'elemento', 'bien'],
    'proveedor': ['distribuidor', 'fabricante', 'suministrador', 'vendedor'],
    'movimiento': ['transacción', 'operación', 'registro', 'entrada', 'salida'],
    'inventario': ['stock', 'existencias', 'mercancía', 'productos'],
    'almacén': ['bodega', 'depósito', 'warehouse', 'stockroom'],
    'categoría': ['clasificación', 'tipo', 'grupo', 'familia'],
    'precio': ['costo', 'valor', 'tarifa', 'importe'],
    'cantidad': ['número', 'total', 'suma', 'volumen'],
    'fecha': ['día', 'momento', 'instante', 'periodo'],
    'estado': ['condición', 'situación', 'status', 'estatus'],
    'activo': ['disponible', 'funcional', 'operativo', 'vigente'],
    'inactivo': ['deshabilitado', 'suspendido', 'cancelado', 'descontinuado'],
    'pendiente': ['en espera', 'por procesar', 'sin resolver', 'aguardando'],
    'completado': ['finalizado', 'terminado', 'concluido', 'realizado'],
    'error': ['problema', 'fallo', 'defecto', 'inconveniente'],
    'sistema': ['aplicación', 'programa', 'software', 'plataforma'],
    'usuario': ['cliente', 'operador', 'administrador', 'empleado'],
  };

  // Configuraciones por tipo de importación
  private readonly configuraciones: Record<string, ConfiguracionAutocorreccion> = {
    productos: {
      habilitarOrtografia: true,
      habilitarNormalizacion: true,
      habilitarSugerencias: true,
      nivelConfianzaMinimo: 70,
      idioma: 'es',
      camposEspecificos: {
        nombre: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        descripcion: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        categoria: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        proveedor: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        ubicacion: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        codigoBarras: { correccionOrtografica: false, normalizacion: true, sugerencias: false },
        sku: { correccionOrtografica: false, normalizacion: true, sugerencias: false },
        unidadMedida: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
      }
    },
    proveedores: {
      habilitarOrtografia: true,
      habilitarNormalizacion: true,
      habilitarSugerencias: true,
      nivelConfianzaMinimo: 75,
      idioma: 'es',
      camposEspecificos: {
        nombre: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        email: { correccionOrtografica: false, normalizacion: true, sugerencias: false },
        telefono: { correccionOrtografica: false, normalizacion: true, sugerencias: false },
        direccion: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        ciudad: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        pais: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
      }
    },
    movimientos: {
      habilitarOrtografia: true,
      habilitarNormalizacion: true,
      habilitarSugerencias: true,
      nivelConfianzaMinimo: 80,
      idioma: 'es',
      camposEspecificos: {
        tipo: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        motivo: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        ubicacion: { correccionOrtografica: true, normalizacion: true, sugerencias: true },
        referencia: { correccionOrtografica: false, normalizacion: true, sugerencias: false },
      }
    }
  };

  /**
   * Corrige la ortografía de un texto
   */
  corregirOrtografia(texto: string, campo?: string): CorreccionOrtografica {
    if (!texto || typeof texto !== 'string') {
      return {
        palabraOriginal: texto || '',
        palabraCorregida: texto || '',
        confianza: 0,
        tipo: 'ortografia',
        sugerencias: []
      };
    }

    const palabras = texto.trim().split(/\s+/);
    if (palabras.length === 1) {
      return this.corregirPalabra(palabras[0], campo);
    }

    // Para textos con múltiples palabras, corregir cada una
    const palabrasCorregidas = palabras.map(palabra => {
      const correccion = this.corregirPalabra(palabra, campo);
      return correccion.palabraCorregida;
    });

    const textoCorregido = palabrasCorregidas.join(' ');
    const confianza = palabras.reduce((acc, palabra, index) => {
      const correccion = this.corregirPalabra(palabra, campo);
      return acc + correccion.confianza;
    }, 0) / palabras.length;

    return {
      palabraOriginal: texto,
      palabraCorregida: textoCorregido,
      confianza: Math.round(confianza),
      tipo: 'ortografia',
      sugerencias: [textoCorregido]
    };
  }

  /**
   * Corrige una palabra individual
   */
  private corregirPalabra(palabra: string, campo?: string): CorreccionOrtografica {
    if (!palabra || typeof palabra !== 'string') {
      return {
        palabraOriginal: palabra || '',
        palabraCorregida: palabra || '',
        confianza: 0,
        tipo: 'ortografia',
        sugerencias: []
      };
    }

    const palabraLower = palabra.toLowerCase();

    // Verificar cache
    if (this.cacheCorrecciones.has(palabraLower)) {
      const corregida = this.cacheCorrecciones.get(palabraLower)!;
      return {
        palabraOriginal: palabra,
        palabraCorregida: corregida,
        confianza: 95,
        tipo: 'ortografia',
        sugerencias: [corregida]
      };
    }

    // Normalizaciones específicas por campo
    if (campo === 'email') {
      // Normalizar email
      const emailNormalizado = palabraLower.replace(/\s+/g, '').trim();
      if (emailNormalizado !== palabraLower) {
        return {
          palabraOriginal: palabra,
          palabraCorregida: emailNormalizado,
          confianza: 90,
          tipo: 'normalizacion',
          sugerencias: [emailNormalizado]
        };
      }
    }

    if (campo === 'telefono') {
      // Normalizar teléfono
      const telefonoNormalizado = palabra.replace(/\D/g, '');
      if (telefonoNormalizado !== palabra) {
        return {
          palabraOriginal: palabra,
          palabraCorregida: telefonoNormalizado,
          confianza: 85,
          tipo: 'normalizacion',
          sugerencias: [telefonoNormalizado]
        };
      }
    }

    if (campo === 'codigoBarras' || campo === 'sku') {
      // Normalizar códigos
      const codigoNormalizado = palabra.replace(/\s+/g, '').toUpperCase();
      if (codigoNormalizado !== palabra) {
        return {
          palabraOriginal: palabra,
          palabraCorregida: codigoNormalizado,
          confianza: 90,
          tipo: 'normalizacion',
          sugerencias: [codigoNormalizado]
        };
      }
    }

    // Reglas generales
    if (this.diccionarioEspanol.has(palabraLower)) {
      return {
        palabraOriginal: palabra,
        palabraCorregida: palabra,
        confianza: 100,
        tipo: 'ortografia',
        sugerencias: []
      };
    }

    // Buscar en errores comunes
    if (this.erroresComunes[palabraLower]) {
      const corregida = this.erroresComunes[palabraLower];
      return {
        palabraOriginal: palabra,
        palabraCorregida: corregida,
        confianza: 95,
        tipo: 'ortografia',
        sugerencias: [corregida]
      };
    }

    return {
      palabraOriginal: palabra,
      palabraCorregida: palabra,
      confianza: 0,
      tipo: 'ortografia',
      sugerencias: []
    };
  }

  /**
   * Busca sinónimos de una palabra
   */
  private buscarSinonimos(palabra: string): string[] {
    const palabraLower = palabra.toLowerCase();
    
    // Verificar cache
    if (this.cacheSinonimos.has(palabraLower)) {
      return this.cacheSinonimos.get(palabraLower)!;
    }

    // Buscar en diccionario de sinónimos
    const sinonimos = this.sinonimos[palabraLower] || [];
    
    // Cachear resultado
    this.cacheSinonimos.set(palabraLower, sinonimos);
    
    return sinonimos;
  }

  /**
   * Aplica reglas de corrección específicas
   */
  private aplicarReglasCorreccion(palabra: string): string | null {
    const palabraLower = palabra.toLowerCase();
    
    // Reglas de acentuación
    const reglasAcentuacion: Record<string, string> = {
      'electronico': 'electrónico',
      'medicamento': 'medicamento',
      'centimetro': 'centímetro',
      'centimetros': 'centímetros',
      'almacen': 'almacén',
      'deposito': 'depósito',
      'mercancia': 'mercancía',
      'articulo': 'artículo',
      'seccion': 'sección',
      'area': 'área',
      'areas': 'áreas',
      'version': 'versión',
      'dia': 'día',
      'dias': 'días',
      'periodo': 'período',
      'periodos': 'períodos',
      'aplicacion': 'aplicación',
      'aplicaciones': 'aplicaciones',
    };

    return reglasAcentuacion[palabraLower] || null;
  }

  /**
   * Normaliza un campo específico
   */
  normalizarCampo(valor: string, campo: string, tipoImportacion: string): CorreccionCampo {
    if (!valor || typeof valor !== 'string') {
      return {
        campo,
        valorOriginal: valor || '',
        valorCorregido: valor || '',
        tipoCorreccion: 'normalizacion',
        confianza: 0,
        explicacion: 'Valor vacío o inválido',
        sugerencias: []
      };
    }

    const config = this.obtenerConfiguracion(tipoImportacion);
    const campoConfig = config.camposEspecificos[campo];

    if (!campoConfig?.normalizacion) {
      return {
        campo,
        valorOriginal: valor,
        valorCorregido: valor,
        tipoCorreccion: 'normalizacion',
        confianza: 100,
        explicacion: 'Normalización deshabilitada para este campo',
        sugerencias: []
      };
    }

    const { valorNormalizado, confianza, explicacion, sugerencias } = this.aplicarNormalizacion(valor, campo);

    return {
      campo,
      valorOriginal: valor,
      valorCorregido: valorNormalizado,
      tipoCorreccion: 'normalizacion',
      confianza,
      explicacion,
      sugerencias
    };
  }

  /**
   * Aplica normalización específica por campo
   */
  private aplicarNormalizacion(valor: string, campo: string): {
    valorNormalizado: string;
    confianza: number;
    explicacion: string;
    sugerencias: string[];
  } {
    let valorNormalizado = valor;
    let confianza = 100;
    let explicacion = 'Sin cambios necesarios';
    let sugerencias: string[] = [];

    switch (campo.toLowerCase()) {
      case 'email':
        valorNormalizado = valor.toLowerCase().replace(/\s+/g, '').trim();
        if (valorNormalizado !== valor) {
          explicacion = 'Email normalizado: eliminados espacios y convertido a minúsculas';
          confianza = 95;
        }
        break;

      case 'telefono':
        valorNormalizado = valor.replace(/\D/g, '');
        if (valorNormalizado !== valor) {
          explicacion = 'Teléfono normalizado: eliminados caracteres no numéricos';
          confianza = 90;
        }
        break;

      case 'codigobarras':
      case 'sku':
        valorNormalizado = valor.replace(/\s+/g, '').toUpperCase();
        if (valorNormalizado !== valor) {
          explicacion = 'Código normalizado: eliminados espacios y convertido a mayúsculas';
          confianza = 95;
        }
        break;

      case 'nombre':
      case 'descripcion':
        valorNormalizado = valor.trim().replace(/\s+/g, ' ');
        if (valorNormalizado !== valor) {
          explicacion = 'Texto normalizado: eliminados espacios extra';
          confianza = 85;
        }
        break;

      case 'precio':
      case 'costo':
      case 'valor':
        valorNormalizado = valor.replace(/[^\d.,]/g, '').replace(',', '.');
        if (valorNormalizado !== valor) {
          explicacion = 'Número normalizado: eliminados caracteres no numéricos';
          confianza = 90;
        }
        break;

      case 'cantidad':
        valorNormalizado = valor.replace(/[^\d]/g, '');
        if (valorNormalizado !== valor) {
          explicacion = 'Cantidad normalizada: eliminados caracteres no numéricos';
          confianza = 90;
        }
        break;

      case 'fecha':
        // Intentar normalizar formato de fecha
        const fechaMatch = valor.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (fechaMatch) {
          const [, dia, mes, año] = fechaMatch;
          const añoCompleto = año.length === 2 ? `20${año}` : año;
          valorNormalizado = `${añoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          explicacion = 'Fecha normalizada a formato ISO';
          confianza = 95;
        }
        break;

      default:
        // Normalización general
        valorNormalizado = valor.trim();
        if (valorNormalizado !== valor) {
          explicacion = 'Texto normalizado: eliminados espacios al inicio y final';
          confianza = 80;
        }
    }

    return {
      valorNormalizado,
      confianza,
      explicacion,
      sugerencias: [valorNormalizado]
    };
  }

  /**
   * Genera sugerencias para un campo
   */
  private generarSugerencias(valor: string, campo: string, tipoImportacion: string): string[] {
    const sugerencias: string[] = [];
    const config = this.obtenerConfiguracion(tipoImportacion);
    const campoConfig = config.camposEspecificos[campo];

    if (!campoConfig?.sugerencias) {
      return sugerencias;
    }

    // Sugerencias basadas en sinónimos
    const sinonimos = this.buscarSinonimos(valor.toLowerCase());
    sugerencias.push(...sinonimos);

    // Sugerencias basadas en el campo
    switch (campo.toLowerCase()) {
      case 'categoria':
        sugerencias.push('Electrónicos', 'Medicamentos', 'Alimentos', 'Ropa', 'Herramientas');
        break;
      case 'estado':
        sugerencias.push('Activo', 'Inactivo', 'Pendiente', 'Completado', 'Cancelado');
        break;
      case 'tipo':
        sugerencias.push('Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Conteo');
        break;
    }

    return sugerencias.slice(0, 5); // Máximo 5 sugerencias
  }

  /**
   * Procesa correcciones para un conjunto de datos
   */
  procesarCorrecciones(
    datos: Record<string, any>[],
    tipoImportacion: string,
    configuracion?: Partial<ConfiguracionAutocorreccion>
  ): {
    datosCorregidos: Record<string, any>[];
    correcciones: CorreccionCampo[];
    estadisticas: {
      totalCorrecciones: number;
      correccionesPorTipo: Record<string, number>;
      camposMasCorregidos: Array<{ campo: string; cantidad: number }>;
      confianzaPromedio: number;
    };
  } {
    const config = configuracion ? { ...this.obtenerConfiguracion(tipoImportacion), ...configuracion } : this.obtenerConfiguracion(tipoImportacion);
    const datosCorregidos: Record<string, any>[] = [];
    const correcciones: CorreccionCampo[] = [];
    const estadisticas = {
      totalCorrecciones: 0,
      correccionesPorTipo: {} as Record<string, number>,
      camposMasCorregidos: [] as Array<{ campo: string; cantidad: number }>,
      confianzaPromedio: 0
    };

    const contadorCampos: Record<string, number> = {};

    for (const dato of datos) {
      const datoCorregido: Record<string, any> = { ...dato };

      for (const [campo, valor] of Object.entries(dato)) {
        if (typeof valor === 'string' && valor.trim()) {
          const campoConfig = config.camposEspecificos[campo];
          
          if (campoConfig) {
            // Aplicar corrección ortográfica si está habilitada
            if (campoConfig.correccionOrtografica && config.habilitarOrtografia) {
              const correccionOrtografica = this.corregirOrtografia(valor, campo);
              if (correccionOrtografica.confianza > config.nivelConfianzaMinimo) {
                datoCorregido[campo] = correccionOrtografica.palabraCorregida;
                correcciones.push({
                  campo,
                  valorOriginal: valor,
                  valorCorregido: correccionOrtografica.palabraCorregida,
                  tipoCorreccion: 'ortografia',
                  confianza: correccionOrtografica.confianza,
                  explicacion: `Corrección ortográfica: ${correccionOrtografica.tipo}`,
                  sugerencias: correccionOrtografica.sugerencias
                });
                estadisticas.totalCorrecciones++;
                contadorCampos[campo] = (contadorCampos[campo] || 0) + 1;
              }
            }

            // Aplicar normalización si está habilitada
            if (campoConfig.normalizacion && config.habilitarNormalizacion) {
              const correccionNormalizacion = this.normalizarCampo(valor, campo, tipoImportacion);
              if (correccionNormalizacion.confianza > config.nivelConfianzaMinimo) {
                datoCorregido[campo] = correccionNormalizacion.valorCorregido;
                correcciones.push(correccionNormalizacion);
                estadisticas.totalCorrecciones++;
                contadorCampos[campo] = (contadorCampos[campo] || 0) + 1;
              }
            }

            // Generar sugerencias si está habilitado
            if (campoConfig.sugerencias && config.habilitarSugerencias) {
              const sugerencias = this.generarSugerencias(valor, campo, tipoImportacion);
              if (sugerencias.length > 0) {
                correcciones.push({
                  campo,
                  valorOriginal: valor,
                  valorCorregido: valor,
                  tipoCorreccion: 'sugerencia',
                  confianza: 50,
                  explicacion: 'Sugerencias disponibles',
                  sugerencias
                });
              }
            }
          }
        }
      }

      datosCorregidos.push(datoCorregido);
    }

    // Calcular estadísticas
    estadisticas.camposMasCorregidos = Object.entries(contadorCampos)
      .map(([campo, cantidad]) => ({ campo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    if (correcciones.length > 0) {
      estadisticas.confianzaPromedio = correcciones.reduce((acc, corr) => acc + corr.confianza, 0) / correcciones.length;
    }

    return {
      datosCorregidos,
      correcciones,
      estadisticas
    };
  }

  /**
   * Obtiene la configuración para un tipo de importación
   */
  obtenerConfiguracion(tipoImportacion: string): ConfiguracionAutocorreccion {
    return this.configuraciones[tipoImportacion] || this.configuraciones.productos;
  }

  /**
   * Actualiza la configuración para un tipo de importación
   */
  actualizarConfiguracion(
    tipoImportacion: string,
    configuracion: Partial<ConfiguracionAutocorreccion>
  ): void {
    if (this.configuraciones[tipoImportacion]) {
      this.configuraciones[tipoImportacion] = {
        ...this.configuraciones[tipoImportacion],
        ...configuracion
      };
    }
  }

  /**
   * Limpia el cache de correcciones
   */
  limpiarCache(): void {
    this.cacheCorrecciones.clear();
    this.cacheSinonimos.clear();
    this.logger.log('Cache de autocorrección limpiado');
  }

  /**
   * Obtiene estadísticas del cache
   */
  obtenerEstadisticasCache(): {
    correccionesCacheadas: number;
    sinonimosCacheados: number;
  } {
    return {
      correccionesCacheadas: this.cacheCorrecciones.size,
      sinonimosCacheados: this.cacheSinonimos.size
    };
  }
} 