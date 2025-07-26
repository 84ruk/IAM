import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export interface ArchivoProcesado {
  datos: any[];
  encabezados: string[];
  totalRegistros: number;
  nombreArchivo: string;
  tipoArchivo: 'excel' | 'csv';
  rutaArchivo: string;
}

export interface OpcionesProcesamiento {
  maxRegistros?: number;
  columnasRequeridas?: string[];
  columnasOpcionales?: string[];
  validarEncabezados?: boolean;
  ignorarFilasVacias?: boolean;
  normalizarEncabezados?: boolean;
}

@Injectable()
export class ProcesadorArchivosService {
  private readonly logger = new Logger(ProcesadorArchivosService.name);
  private readonly maxTamanoArchivo = 50 * 1024 * 1024; // 50MB
  private readonly tiposPermitidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/x-iwork-numbers-sffnumbers', // .numbers (Mac Numbers)
    'text/csv', // .csv
    'application/csv', // .csv alternativo
  ];

  /**
   * Procesa un archivo Excel o CSV y retorna los datos estructurados
   */
  async procesarArchivo(
    rutaArchivo: string,
    opciones: OpcionesProcesamiento = {}
  ): Promise<ArchivoProcesado> {
    try {
      this.logger.log(`📁 Procesando archivo: ${rutaArchivo}`);

      // Validar que el archivo existe
      if (!fs.existsSync(rutaArchivo)) {
        throw new BadRequestException('El archivo no existe');
      }

      // Validar tamaño del archivo
      const stats = fs.statSync(rutaArchivo);
      if (stats.size > this.maxTamanoArchivo) {
        throw new BadRequestException(`El archivo excede el tamaño máximo permitido (${this.maxTamanoArchivo / 1024 / 1024}MB)`);
      }

      // Determinar tipo de archivo
      const extension = path.extname(rutaArchivo).toLowerCase();
      const tipoArchivo = this.determinarTipoArchivo(extension);

      // Leer archivo según su tipo
      let datos: any[];
      let encabezados: string[];

      if (tipoArchivo === 'excel') {
        const resultado = await this.leerArchivoExcel(rutaArchivo);
        datos = resultado.datos;
        encabezados = resultado.encabezados;
      } else {
        const resultado = await this.leerArchivoCSV(rutaArchivo);
        datos = resultado.datos;
        encabezados = resultado.encabezados;
      }

      // Aplicar opciones de procesamiento
      datos = await this.aplicarOpcionesProcesamiento(datos, encabezados, opciones);

      // Validar límite de registros
      if (opciones.maxRegistros && datos.length > opciones.maxRegistros) {
        throw new BadRequestException(`El archivo excede el límite de ${opciones.maxRegistros} registros`);
      }

      // Validar columnas requeridas
      if (opciones.columnasRequeridas && opciones.validarEncabezados) {
        this.validarColumnasRequeridas(encabezados, opciones.columnasRequeridas);
      }

      const resultado: ArchivoProcesado = {
        datos,
        encabezados,
        totalRegistros: datos.length,
        nombreArchivo: path.basename(rutaArchivo),
        tipoArchivo,
        rutaArchivo,
      };

      this.logger.log(`✅ Archivo procesado: ${datos.length} registros encontrados`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error procesando archivo ${rutaArchivo}:`, error);
      throw error;
    }
  }

  /**
   * Lee un archivo Excel (.xlsx, .xls)
   */
  private async leerArchivoExcel(rutaArchivo: string): Promise<{ datos: any[]; encabezados: string[] }> {
    try {
      const workbook = XLSX.readFile(rutaArchivo, {
        cellDates: true,
        cellNF: false,
        cellText: false,
      });

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con encabezados
      const datosRaw = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
      });

      if (datosRaw.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío');
      }

      // Extraer encabezados (primera fila)
      const encabezadosOriginales = (datosRaw[0] as any[]).map((header: any) => 
        header?.toString() || ''
      );
      
      // Mapear encabezados a nombres estándar
      const encabezados = encabezadosOriginales.map((header: any) => 
        this.mapearEncabezadoAEstándar(header)
      );
      
      this.logger.log(`📋 Encabezados originales: ${encabezadosOriginales.join(', ')}`);
      this.logger.log(`📋 Encabezados mapeados: ${encabezados.join(', ')}`);
      
      // Validar encabezados duplicados después del mapeo
      const encabezadosDuplicados = this.detectarEncabezadosDuplicados(encabezados);
      if (encabezadosDuplicados.length > 0) {
        this.logger.warn(`⚠️ Encabezados duplicados detectados: ${encabezadosDuplicados.join(', ')}`);
        this.logger.warn(`🔧 Se usarán los valores de la primera columna encontrada para cada encabezado duplicado`);
      }

      // Convertir datos a objetos
      const datos = datosRaw.slice(1).map((fila: any[], index: number) => {
        const objeto: any = { _filaOriginal: index + 2 };
        
        // Verificar si la fila está completamente vacía antes de procesarla
        const filaVacia = fila.every(celda => 
          celda === null || 
          celda === undefined || 
          celda === '' || 
          (typeof celda === 'string' && celda.trim() === '')
        );
        
        if (filaVacia) {
          // Marcar fila como vacía para que el filtro la elimine
          return { _filaOriginal: index + 2, _filaVacia: true };
        }
        
        encabezados.forEach((encabezado: string, colIndex: number) => {
          // Usar nullish coalescing para preservar 0 y otros valores falsy válidos
          objeto[encabezado] = fila[colIndex] ?? null;
        });
        
        // También agregar los nombres originales para compatibilidad
        encabezadosOriginales.forEach((encabezadoOriginal: string, colIndex: number) => {
          const encabezadoNormalizado = encabezados[colIndex];
          if (encabezadoOriginal !== encabezadoNormalizado) {
            objeto[encabezadoOriginal] = fila[colIndex] ?? null;
          }
        });
        
        return objeto;
      });

      return { datos, encabezados };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  /**
   * Lee un archivo CSV
   */
  private async leerArchivoCSV(rutaArchivo: string): Promise<{ datos: any[]; encabezados: string[] }> {
    try {
      const contenido = await readFileAsync(rutaArchivo, 'utf-8');
      const lineas = contenido.split('\n').filter(linea => linea.trim());

      if (lineas.length === 0) {
        throw new BadRequestException('El archivo CSV está vacío');
      }

      // Detectar delimitador
      const delimitador = this.detectarDelimitador(lineas[0]);

      // Procesar encabezados
      const encabezadosRaw = lineas[0].split(delimitador);
      const encabezadosOriginales = encabezadosRaw.map(header => 
        header.replace(/"/g, '').trim()
      );
      const encabezados = encabezadosOriginales.map(header => 
        this.mapearEncabezadoAEstándar(header)
      );
      
      this.logger.log(`📋 Encabezados originales: ${encabezadosOriginales.join(', ')}`);
      this.logger.log(`📋 Encabezados mapeados: ${encabezados.join(', ')}`);
      
      // Validar encabezados duplicados después del mapeo
      const encabezadosDuplicados = this.detectarEncabezadosDuplicados(encabezados);
      if (encabezadosDuplicados.length > 0) {
        this.logger.warn(`⚠️ Encabezados duplicados detectados: ${encabezadosDuplicados.join(', ')}`);
        this.logger.warn(`🔧 Se usarán los valores de la primera columna encontrada para cada encabezado duplicado`);
      }

      // Procesar datos
      const datos = lineas.slice(1).map((linea, index) => {
        const valores = this.parsearLineaCSV(linea, delimitador);
        const objeto: any = { _filaOriginal: index + 2 };
        
        encabezados.forEach((encabezado, colIndex) => {
          objeto[encabezado] = valores[colIndex] || null;
        });
        
        return objeto;
      });

      return { datos, encabezados };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error leyendo archivo CSV: ${error.message}`);
    }
  }

  /**
   * Aplica opciones de procesamiento a los datos
   */
  private async aplicarOpcionesProcesamiento(
    datos: any[],
    encabezados: string[],
    opciones: OpcionesProcesamiento
  ): Promise<any[]> {
    let datosProcesados = [...datos];

    // Filtrar filas vacías
    if (opciones.ignorarFilasVacias) {
      datosProcesados = datosProcesados.filter(fila => {
        // Excluir campos especiales del procesamiento
        const camposExcluidos = ['_filaOriginal', '_filaVacia'];
        
        // Si la fila está marcada como vacía, eliminarla
        if (fila._filaVacia) {
          return false;
        }
        
        // Verificar si la fila tiene al menos un valor no vacío en campos relevantes
        return Object.entries(fila).some(([key, valor]) => {
          // Ignorar campos especiales del procesamiento
          if (camposExcluidos.includes(key)) {
            return false;
          }
          
          // Considerar vacío si es null, undefined, string vacío o solo espacios
          return valor !== null && 
                 valor !== undefined && 
                 valor !== '' && 
                 (typeof valor !== 'string' || valor.trim() !== '');
        });
      });
      
      this.logger.log(`🧹 Filtradas ${datos.length - datosProcesados.length} filas vacías`);
    }

    // Normalizar encabezados si es necesario
    if (opciones.normalizarEncabezados) {
      datosProcesados = datosProcesados.map(fila => {
        const filaNormalizada: any = {};
        Object.keys(fila).forEach(key => {
          // Mantener el nombre original del campo para compatibilidad
          const keyNormalizada = this.normalizarEncabezado(key);
          filaNormalizada[keyNormalizada] = fila[key];
          
          // También mantener el nombre original para compatibilidad con validadores
          if (key !== keyNormalizada) {
            filaNormalizada[key] = fila[key];
          }
        });
        return filaNormalizada;
      });
    }

    // Limpiar y normalizar valores
    datosProcesados = datosProcesados.map(fila => {
      const filaLimpia: any = {};
      Object.keys(fila).forEach(key => {
        let valor = fila[key];
        
        // Convertir valores vacíos a null
        if (valor === '' || valor === undefined) {
          valor = null;
        }
        
        // Normalizar números
        if (typeof valor === 'string' && !isNaN(Number(valor)) && valor.trim() !== '') {
          const numero = Number(valor);
          if (Number.isInteger(numero)) {
            valor = numero;
          } else {
            valor = parseFloat(valor);
          }
        }
        
        filaLimpia[key] = valor;
      });
      return filaLimpia;
    });

    return datosProcesados;
  }

  /**
   * Valida que las columnas requeridas estén presentes
   */
  private validarColumnasRequeridas(encabezados: string[], columnasRequeridas: string[]): void {
    const encabezadosNormalizados = encabezados.map(h => h.toLowerCase());
    const columnasFaltantes = columnasRequeridas.filter(columna => 
      !encabezadosNormalizados.includes(columna.toLowerCase())
    );

    if (columnasFaltantes.length > 0) {
      // Intentar sugerir columnas similares
      const sugerencias = columnasFaltantes.map(columna => {
        const sugerenciasColumna = this.sugerirColumnasSimilares(columna, encabezados);
        return sugerenciasColumna.length > 0 
          ? `${columna} (sugerencias: ${sugerenciasColumna.join(', ')})`
          : columna;
      });
      
      throw new BadRequestException(
        `Columnas requeridas faltantes: ${sugerencias.join(', ')}`
      );
    }
  }

  /**
   * Sugiere columnas similares cuando no se encuentra una columna requerida
   */
  private sugerirColumnasSimilares(columnaRequerida: string, encabezadosDisponibles: string[]): string[] {
    const sugerencias: string[] = [];
    const columnaLower = columnaRequerida.toLowerCase();
    
    encabezadosDisponibles.forEach(encabezado => {
      const encabezadoLower = encabezado.toLowerCase();
      
      // Coincidencia exacta (ignorando mayúsculas)
      if (encabezadoLower === columnaLower) {
        sugerencias.unshift(encabezado); // Prioridad alta
      }
      // Coincidencia parcial
      else if (encabezadoLower.includes(columnaLower) || columnaLower.includes(encabezadoLower)) {
        sugerencias.push(encabezado);
      }
      // Coincidencia por similitud (al menos 70% de caracteres en común)
      else if (this.calcularSimilitud(encabezadoLower, columnaLower) > 0.7) {
        sugerencias.push(encabezado);
      }
    });
    
    return sugerencias.slice(0, 3); // Máximo 3 sugerencias
  }

  /**
   * Calcula la similitud entre dos strings usando el algoritmo de Levenshtein
   */
  private calcularSimilitud(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distancia = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength === 0 ? 1 : (maxLength - distancia) / maxLength;
  }

  /**
   * Normaliza un encabezado para consistencia con múltiples estrategias
   */
  private normalizarEncabezado(encabezado: string): string {
    if (!encabezado || typeof encabezado !== 'string') {
      return '';
    }

    // 1. Limpiar espacios y caracteres especiales
    let normalizado = encabezado
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/[^\w\s]/g, ' ') // Remover caracteres especiales excepto letras, números y espacios
      .trim();

    // 2. Convertir a minúsculas
    normalizado = normalizado.toLowerCase();

    // 3. Reemplazar espacios con guiones bajos
    normalizado = normalizado.replace(/\s+/g, '_');

    // 4. Limpiar múltiples guiones bajos
    normalizado = normalizado.replace(/_+/g, '_');

    // 5. Remover guiones bajos al inicio y final
    normalizado = normalizado.replace(/^_|_$/g, '');

    return normalizado;
  }

  /**
   * Mapea encabezados a nombres estándar usando múltiples estrategias
   */
  private mapearEncabezadoAEstándar(encabezado: string): string {
    const normalizado = this.normalizarEncabezado(encabezado);
    
    // Mapeo de variaciones en español a nombres estándar
    const mapeoEncabezados: Record<string, string> = {
      // Nombre del producto
      'nombre': 'nombre',
      'name': 'nombre',
      'producto': 'nombre',
      'product': 'nombre',
      'producto_nombre': 'nombre',
      'nombre_producto': 'nombre',
      'product_name': 'nombre',
      'productname': 'nombre',
      
      // Descripción
      'descripcion': 'descripcion',
      'description': 'descripcion',
      'desc': 'descripcion',
      'detalle': 'descripcion',
      'detail': 'descripcion',
      'descripcion_producto': 'descripcion',
      'producto_descripcion': 'descripcion',
      'detalles': 'descripcion',
      'details': 'descripcion',
      
      // Stock
      'stock': 'stock',
      'cantidad': 'stock',
      'quantity': 'stock',
      'qty': 'stock',
      'inventario': 'stock',
      'inventory': 'stock',
      'existencia': 'stock',
      'existencias': 'stock',
      'stock_actual': 'stock',
      'stock_disponible': 'stock',
      'cantidad_disponible': 'stock',
      'cantidad_stock': 'stock',
      
      // Precio de Compra
      'preciocompra': 'precioCompra',
      'precio_compra': 'precioCompra',
      'precio_de_compra': 'precioCompra',
      'precio compra': 'precioCompra',
      'preciocompra_producto': 'precioCompra',
      'precio_compra_producto': 'precioCompra',
      'precio_de_compra_producto': 'precioCompra',
      'precio_compra_unidad': 'precioCompra',
      'precio_de_compra_unidad': 'precioCompra',
      'precio_compra_unitario': 'precioCompra',
      'precio_de_compra_unitario': 'precioCompra',
      'costo': 'precioCompra',
      'costo_producto': 'precioCompra',
      'costo_unidad': 'precioCompra',
      'costo_unitario': 'precioCompra',
      'precio_costo': 'precioCompra',
      'costo_compra': 'precioCompra',
      'purchase_price': 'precioCompra',
      'purchaseprice': 'precioCompra',
      'cost': 'precioCompra',
      'cost_price': 'precioCompra',
      'costprice': 'precioCompra',
      
      // Precio de Venta
      'precioventa': 'precioVenta',
      'precio_venta': 'precioVenta',
      'precio_de_venta': 'precioVenta',
      'precio venta': 'precioVenta',
      'precioventa_producto': 'precioVenta',
      'precio_venta_producto': 'precioVenta',
      'precio_de_venta_producto': 'precioVenta',
      'precio_venta_unidad': 'precioVenta',
      'precio_de_venta_unidad': 'precioVenta',
      'precio_venta_unitario': 'precioVenta',
      'precio_de_venta_unitario': 'precioVenta',
      'precio': 'precioVenta',
      'precio_producto': 'precioVenta',
      'precio_unidad': 'precioVenta',
      'precio_unitario': 'precioVenta',
      'precio_publico': 'precioVenta',
      'precio_final': 'precioVenta',
      'sale_price': 'precioVenta',
      'saleprice': 'precioVenta',
      'price': 'precioVenta',
      'selling_price': 'precioVenta',
      'sellingprice': 'precioVenta',
      
      // Stock Mínimo
      'stockminimo': 'stockMinimo',
      'stock_minimo': 'stockMinimo',
      'stock_de_minimo': 'stockMinimo',
      'stock minimo': 'stockMinimo',
      'stock_min': 'stockMinimo',
      'stockmin': 'stockMinimo',
      'stock_minimo_requerido': 'stockMinimo',
      'stock_de_minimo_requerido': 'stockMinimo',
      'stock_minimo_disponible': 'stockMinimo',
      'stock_de_minimo_disponible': 'stockMinimo',
      'cantidad_minima': 'stockMinimo',
      'cantidad_de_minima': 'stockMinimo',
      'cantidad_min': 'stockMinimo',
      'cantidadminima': 'stockMinimo',
      'cantidadmin': 'stockMinimo',
      'min_stock': 'stockMinimo',
      'minstock': 'stockMinimo',
      'minimum_stock': 'stockMinimo',
      'minimumstock': 'stockMinimo',
      
      // Tipo de Producto
      'tipoproducto': 'tipoProducto',
      'tipo_producto': 'tipoProducto',
      'tipo producto': 'tipoProducto',
      'tipo': 'tipoProducto',
      'categoria': 'tipoProducto',
      'categoria_producto': 'tipoProducto',
      'producto_tipo': 'tipoProducto',
      'producto_categoria': 'tipoProducto',
      'clasificacion': 'tipoProducto',
      'clasificacion_producto': 'tipoProducto',
      'product_type': 'tipoProducto',
      'producttype': 'tipoProducto',
      'type': 'tipoProducto',
      'category': 'tipoProducto',
      
      // Unidad
      'unidad': 'unidad',
      'unidad_medida': 'unidad',
      'unidad_de_medida': 'unidad',
      'unidadmedida': 'unidad',
      'medida': 'unidad',
      'medida_unidad': 'unidad',
      'medida_de_unidad': 'unidad',
      'unit': 'unidad',
      'measure': 'unidad',
      'measurement': 'unidad',
      'uom': 'unidad', // Unit of Measure
      
      // Estado
      'estado': 'estado',
      'estado_producto': 'estado',
      'estado_del_producto': 'estado',
      'producto_estado': 'estado',
      'activo': 'estado',
      'activo_inactivo': 'estado',
      'status': 'estado',
      'active': 'estado',
      
      // Código de Barras
      'codigobarras': 'codigoBarras',
      'codigo_barras': 'codigoBarras',
      'codigo barras': 'codigoBarras',
      'codigo_barras_producto': 'codigoBarras',
      'barras': 'codigoBarras',
      'codigo_barras_unico': 'codigoBarras',
      'barcode': 'codigoBarras',
      'bar_code': 'codigoBarras',
      'barcodes': 'codigoBarras',
      
      // SKU
      'sku': 'sku',
      'codigo': 'sku',
      'codigo_producto': 'sku',
      'codigo_interno': 'sku',
      'codigo_unico': 'sku',
      'codigo_identificacion': 'sku',
      'identificador': 'sku',
      'identificador_producto': 'sku',
      'code': 'sku',
      'product_code': 'sku',
      'productcode': 'sku',
      'item_code': 'sku',
      'itemcode': 'sku',
      
      // Etiquetas
      'etiquetas': 'etiquetas',
      'etiqueta': 'etiquetas',
      'etiquetas_producto': 'etiquetas',
      'tags': 'etiquetas',
      'tag': 'etiquetas',
      'labels': 'etiquetas',
      'label': 'etiquetas',
      
      // Marca
      'marca': 'marca',
      'marca_producto': 'marca',
      'producto_marca': 'marca',
      'fabricante': 'marca',
      'fabricante_producto': 'marca',
      'brand': 'marca',
      'manufacturer': 'marca',
      
      // Modelo
      'modelo': 'modelo',
      'modelo_producto': 'modelo',
      'producto_modelo': 'modelo',
      'version': 'modelo',
      'version_producto': 'modelo',
      'model': 'modelo',
      
      // Especificaciones
      'especificaciones': 'especificaciones',
      'especificacion': 'especificaciones',
      'especificaciones_producto': 'especificaciones',
      'producto_especificaciones': 'especificaciones',
      'detalles_tecnicos': 'especificaciones',
      'caracteristicas': 'especificaciones',
      'caracteristicas_producto': 'especificaciones',
      'specifications': 'especificaciones',
      'specs': 'especificaciones',
      'spec': 'especificaciones',
      'detalles_tecnicos_especificaciones': 'especificaciones',
      'details_tecnicos': 'especificaciones',
      
      // Ubicación
      'ubicacion': 'ubicacion',
      'ubicacion_producto': 'ubicacion',
      'producto_ubicacion': 'ubicacion',
      'lugar': 'ubicacion',
      'lugar_almacenamiento': 'ubicacion',
      'posicion': 'ubicacion',
      'posicion_almacen': 'ubicacion',
      'location': 'ubicacion',
      'place': 'ubicacion',
      'position': 'ubicacion',
      
      // Temperatura
      'temperatura': 'temperatura',
      'temperatura_almacenamiento': 'temperatura',
      'temperatura_requerida': 'temperatura',
      'temp': 'temperatura',
      'temperature': 'temperatura',
      
      // Humedad
      'humedad': 'humedad',
      'humedad_almacenamiento': 'humedad',
      'humedad_requerida': 'humedad',
      'hum': 'humedad',
      'humidity': 'humedad',
    };

    // Buscar coincidencia exacta
    if (mapeoEncabezados[normalizado]) {
      return mapeoEncabezados[normalizado];
    }

    // Buscar coincidencia parcial (para casos como "precio_compra_producto")
    for (const [patron, estandar] of Object.entries(mapeoEncabezados)) {
      if (normalizado.includes(patron) || patron.includes(normalizado)) {
        return estandar;
      }
    }

    // Si no hay coincidencia, devolver el normalizado
    return normalizado;
  }

  /**
   * Detecta encabezados duplicados después del mapeo
   */
  private detectarEncabezadosDuplicados(encabezados: string[]): string[] {
    const duplicados: string[] = [];
    const vistos = new Set<string>();
    
    encabezados.forEach((encabezado, index) => {
      if (vistos.has(encabezado)) {
        duplicados.push(`${encabezado} (columna ${index + 1})`);
      } else {
        vistos.add(encabezado);
      }
    });
    
    return duplicados;
  }

  /**
   * Determina el tipo de archivo basado en la extensión
   */
  private determinarTipoArchivo(extension: string): 'excel' | 'csv' {
    if (['.xlsx', '.xls', '.numbers'].includes(extension)) {
      return 'excel';
    } else if (extension === '.csv') {
      return 'csv';
    } else {
      throw new BadRequestException(`Tipo de archivo no soportado: ${extension}. Formatos soportados: .xlsx, .xls, .numbers, .csv`);
    }
  }

  /**
   * Detecta el delimitador de un archivo CSV
   */
  private detectarDelimitador(primeraLinea: string): string {
    const delimitadores = [',', ';', '\t', '|'];
    const conteos = delimitadores.map(del => ({
      delimitador: del,
      conteo: (primeraLinea.match(new RegExp(`\\${del}`, 'g')) || []).length
    }));

    const delimitadorMasComun = conteos.reduce((prev, current) => 
      current.conteo > prev.conteo ? current : prev
    );

    return delimitadorMasComun.delimitador;
  }

  /**
   * Parsea una línea CSV considerando comillas
   */
  private parsearLineaCSV(linea: string, delimitador: string): string[] {
    const valores: string[] = [];
    let valorActual = '';
    let dentroDeComillas = false;
    let i = 0;

    while (i < linea.length) {
      const caracter = linea[i];

      if (caracter === '"') {
        dentroDeComillas = !dentroDeComillas;
      } else if (caracter === delimitador && !dentroDeComillas) {
        valores.push(valorActual.trim());
        valorActual = '';
      } else {
        valorActual += caracter;
      }

      i++;
    }

    valores.push(valorActual.trim());
    return valores;
  }

  /**
   * Valida el tipo MIME de un archivo
   */
  validarTipoArchivo(mimetype: string): boolean {
    return this.tiposPermitidos.includes(mimetype);
  }

  /**
   * Limpia archivos temporales
   */
  async limpiarArchivoTemporal(rutaArchivo: string): Promise<void> {
    try {
      if (fs.existsSync(rutaArchivo)) {
        await unlinkAsync(rutaArchivo);
        this.logger.log(`🗑️ Archivo temporal eliminado: ${rutaArchivo}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo eliminar archivo temporal ${rutaArchivo}:`, error);
    }
  }
} 