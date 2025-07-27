import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { TipoImportacionUnificada } from '../dto/importacion-unificada.dto';

export interface DeteccionTipoResultado {
  tipo: TipoImportacionUnificada;
  confianza: number; // 0-100
  columnasDetectadas: string[];
  columnasFaltantes: string[];
  razon: string;
}

export interface PatronColumna {
  nombre: string;
  alias: string[];
  peso: number;
  requerida: boolean;
}

@Injectable()
export class DetectorTipoImportacionService {
  private readonly logger = new Logger(DetectorTipoImportacionService.name);

  // Patrones de columnas para cada tipo de importación
  private readonly patronesProductos: PatronColumna[] = [
    { nombre: 'nombre', alias: ['producto', 'descripcion', 'item', 'articulo'], peso: 10, requerida: true },
    { nombre: 'stock', alias: ['cantidad', 'inventario', 'existencia'], peso: 8, requerida: false },
    { nombre: 'precio', alias: ['precio_venta', 'precio_compra', 'costo', 'valor'], peso: 7, requerida: false },
    { nombre: 'categoria', alias: ['tipo', 'clasificacion', 'familia'], peso: 5, requerida: false },
    { nombre: 'codigo_barras', alias: ['barcode', 'sku', 'codigo'], peso: 4, requerida: false },
    { nombre: 'proveedor', alias: ['supplier', 'vendedor', 'fabricante'], peso: 3, requerida: false },
    { nombre: 'unidad_medida', alias: ['unidad', 'medida', 'um'], peso: 3, requerida: false },
  ];

  private readonly patronesProveedores: PatronColumna[] = [
    { nombre: 'nombre', alias: ['proveedor', 'empresa', 'compania', 'razon_social'], peso: 10, requerida: true },
    { nombre: 'email', alias: ['correo', 'e-mail', 'mail'], peso: 8, requerida: false },
    { nombre: 'telefono', alias: ['phone', 'celular', 'movil', 'contacto'], peso: 7, requerida: false },
    { nombre: 'direccion', alias: ['domicilio', 'ubicacion', 'calle'], peso: 5, requerida: false },
    { nombre: 'contacto', alias: ['representante', 'persona_contacto'], peso: 4, requerida: false },
    { nombre: 'rfc', alias: ['tax_id', 'identificacion_fiscal'], peso: 3, requerida: false },
  ];

  private readonly patronesMovimientos: PatronColumna[] = [
    { nombre: 'fecha', alias: ['fecha_movimiento', 'fecha_transaccion', 'dia'], peso: 10, requerida: true },
    { nombre: 'tipo', alias: ['tipo_movimiento', 'operacion', 'accion'], peso: 10, requerida: true },
    { nombre: 'producto', alias: ['productonombre', 'item', 'articulo', 'descripcion'], peso: 9, requerida: true },
    { nombre: 'cantidad', alias: ['cant', 'qty', 'volumen'], peso: 8, requerida: true },
    { nombre: 'motivo', alias: ['razon', 'causa', 'justificacion'], peso: 4, requerida: false },
    { nombre: 'precio', alias: ['costo', 'valor_unitario'], peso: 3, requerida: false },
    { nombre: 'referencia', alias: ['ref', 'documento', 'folio'], peso: 3, requerida: false },
    { nombre: 'codigobarras', alias: ['barcode', 'sku', 'codigo'], peso: 3, requerida: false },
  ];

  /**
   * Detecta automáticamente el tipo de importación basado en las columnas del Excel
   */
  async detectarTipo(rutaArchivo: string): Promise<DeteccionTipoResultado> {
    try {
      this.logger.log(`🔍 Detectando tipo de importación para: ${rutaArchivo}`);

      // Leer el archivo Excel
      const workbook = XLSX.readFile(rutaArchivo);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Obtener las columnas del archivo
      const columnas = this.extraerColumnas(worksheet);
      this.logger.log(`📋 Columnas detectadas: ${columnas.join(', ')}`);

      // Analizar cada tipo de importación
      const resultados = await Promise.all([
        this.analizarPatron(columnas, this.patronesProductos, TipoImportacionUnificada.PRODUCTOS),
        this.analizarPatron(columnas, this.patronesProveedores, TipoImportacionUnificada.PROVEEDORES),
        this.analizarPatron(columnas, this.patronesMovimientos, TipoImportacionUnificada.MOVIMIENTOS),
      ]);

      // Encontrar el mejor resultado
      const mejorResultado = resultados.reduce((mejor, actual) => 
        actual.confianza > mejor.confianza ? actual : mejor
      );

      this.logger.log(`✅ Tipo detectado: ${mejorResultado.tipo} (confianza: ${mejorResultado.confianza}%)`);

      return mejorResultado;

    } catch (error) {
      this.logger.error(`❌ Error detectando tipo:`, error);
      throw new Error(`No se pudo detectar el tipo de importación: ${error.message}`);
    }
  }

  /**
   * Extrae las columnas del worksheet de Excel
   */
  private extraerColumnas(worksheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnas: string[] = [];

    // Leer la primera fila (headers)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const nombreColumna = String(cell.v).toLowerCase().trim();
        columnas.push(nombreColumna);
      }
    }

    return columnas;
  }

  /**
   * Analiza si las columnas coinciden con un patrón específico
   */
  private async analizarPatron(
    columnas: string[], 
    patrones: PatronColumna[], 
    tipo: TipoImportacionUnificada
  ): Promise<DeteccionTipoResultado> {
    let puntuacion = 0;
    let puntuacionMaxima = 0;
    const columnasDetectadas: string[] = [];
    const columnasFaltantes: string[] = [];

    // Calcular puntuación máxima posible
    patrones.forEach(patron => {
      puntuacionMaxima += patron.peso;
    });

    // Analizar cada patrón
    patrones.forEach(patron => {
      const coincidencia = this.buscarCoincidencia(columnas, patron);
      
      if (coincidencia) {
        puntuacion += patron.peso;
        columnasDetectadas.push(coincidencia);
      } else if (patron.requerida) {
        columnasFaltantes.push(patron.nombre);
      }
    });

    // Calcular confianza
    const confianza = Math.round((puntuacion / puntuacionMaxima) * 100);

    // Determinar razón de la detección
    let razon = `Detectado por ${columnasDetectadas.length} columnas coincidentes`;
    if (columnasFaltantes.length > 0) {
      razon += `. Columnas faltantes: ${columnasFaltantes.join(', ')}`;
    }

    return {
      tipo,
      confianza,
      columnasDetectadas,
      columnasFaltantes,
      razon,
    };
  }

  /**
   * Busca una coincidencia entre las columnas del archivo y un patrón
   */
  private buscarCoincidencia(columnas: string[], patron: PatronColumna): string | null {
    // Buscar coincidencia exacta primero
    const coincidenciaExacta = columnas.find(col => 
      col === patron.nombre || patron.alias.includes(col)
    );

    if (coincidenciaExacta) {
      return coincidenciaExacta;
    }

    // Buscar coincidencias parciales
    const coincidenciaParcial = columnas.find(col => {
      // Verificar si la columna contiene palabras del patrón
      const palabrasPatron = [...patron.alias, patron.nombre];
      return palabrasPatron.some(palabra => 
        col.includes(palabra) || palabra.includes(col)
      );
    });

    return coincidenciaParcial || null;
  }

  /**
   * Obtiene información sobre los tipos de importación soportados
   */
  obtenerInformacionTipos(): Array<{
    tipo: TipoImportacionUnificada;
    nombre: string;
    descripcion: string;
    columnasRequeridas: string[];
    columnasOpcionales: string[];
    ejemplos: string[];
  }> {
    return [
      {
        tipo: TipoImportacionUnificada.PRODUCTOS,
        nombre: 'Productos',
        descripcion: 'Importación de productos al inventario',
        columnasRequeridas: ['nombre'],
        columnasOpcionales: ['stock', 'precio', 'categoria', 'codigo_barras', 'proveedor', 'unidad_medida'],
        ejemplos: ['nombre', 'producto', 'descripcion', 'stock', 'cantidad', 'precio_venta', 'categoria'],
      },
      {
        tipo: TipoImportacionUnificada.PROVEEDORES,
        nombre: 'Proveedores',
        descripcion: 'Importación de proveedores',
        columnasRequeridas: ['nombre'],
        columnasOpcionales: ['email', 'telefono', 'direccion', 'contacto', 'rfc'],
        ejemplos: ['nombre', 'proveedor', 'empresa', 'email', 'telefono', 'direccion'],
      },
      {
        tipo: TipoImportacionUnificada.MOVIMIENTOS,
        nombre: 'Movimientos',
        descripcion: 'Importación de movimientos de inventario',
        columnasRequeridas: ['fecha', 'tipo', 'producto', 'cantidad'],
        columnasOpcionales: ['motivo', 'precio', 'referencia'],
        ejemplos: ['fecha', 'tipo', 'producto', 'cantidad', 'motivo', 'precio'],
      },
    ];
  }

  /**
   * Valida si un archivo puede ser procesado automáticamente
   */
  async validarArchivo(rutaArchivo: string): Promise<{
    valido: boolean;
    errores: string[];
    advertencias: string[];
  }> {
    const errores: string[] = [];
    const advertencias: string[] = [];

    try {
      const workbook = XLSX.readFile(rutaArchivo);
      
      if (workbook.SheetNames.length === 0) {
        errores.push('El archivo no contiene hojas de cálculo');
        return { valido: false, errores, advertencias };
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const columnas = this.extraerColumnas(worksheet);

      if (columnas.length === 0) {
        errores.push('No se encontraron columnas en la primera fila');
        return { valido: false, errores, advertencias };
      }

      if (columnas.length < 2) {
        advertencias.push('El archivo tiene muy pocas columnas, verifique el formato');
      }

      // Verificar que al menos una columna coincida con algún patrón
      const todosLosPatrones = [
        ...this.patronesProductos,
        ...this.patronesProveedores,
        ...this.patronesMovimientos,
      ];

      const coincidencias = todosLosPatrones.filter(patron => 
        this.buscarCoincidencia(columnas, patron)
      );

      if (coincidencias.length === 0) {
        errores.push('No se reconocieron las columnas del archivo. Verifique el formato.');
      }

      return {
        valido: errores.length === 0,
        errores,
        advertencias,
      };

    } catch (error) {
      errores.push(`Error al leer el archivo: ${error.message}`);
      return { valido: false, errores, advertencias };
    }
  }
} 