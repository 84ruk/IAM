import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export interface PlantillaConfig {
  nombre: string;
  descripcion: string;
  columnas: ColumnaPlantilla[];
  ejemplos: any[];
  validaciones: ValidacionPlantilla[];
}

export interface ColumnaPlantilla {
  nombre: string;
  descripcion: string;
  requerida: boolean;
  tipo: 'texto' | 'numero' | 'decimal' | 'fecha' | 'email' | 'lista';
  valoresPermitidos?: string[];
  longitudMaxima?: number;
  longitudMinima?: number;
  valorMinimo?: number;
  valorMaximo?: number;
  formato?: string;
}

export interface ValidacionPlantilla {
  columna: string;
  tipo: 'requerido' | 'formato' | 'rango' | 'longitud' | 'lista';
  mensaje: string;
  condicion?: any;
}

@Injectable()
export class PlantillasService {
  private readonly logger = new Logger(PlantillasService.name);
  private readonly directorioPlantillas = path.join(process.cwd(), 'uploads', 'plantillas');

  constructor() {
    this.asegurarDirectorioPlantillas();
  }

  /**
   * Genera una plantilla de Excel para productos
   */
  async generarPlantillaProductos(): Promise<string> {
    const config: PlantillaConfig = {
      nombre: 'Plantilla de Productos',
      descripcion: 'Plantilla para importar productos al sistema de inventario',
      columnas: [
        {
          nombre: 'nombre',
          descripcion: 'Nombre del producto (requerido)',
          requerida: true,
          tipo: 'texto',
          longitudMaxima: 100,
          longitudMinima: 2,
        },
        {
          nombre: 'descripcion',
          descripcion: 'Descripción del producto (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 500,
        },
        {
          nombre: 'stock',
          descripcion: 'Cantidad en stock (requerido)',
          requerida: true,
          tipo: 'numero',
          valorMinimo: 0,
          valorMaximo: 999999,
        },
        {
          nombre: 'precioCompra',
          descripcion: 'Precio de compra (requerido)',
          requerida: true,
          tipo: 'decimal',
          valorMinimo: 0,
          formato: '0.00',
        },
        {
          nombre: 'precioVenta',
          descripcion: 'Precio de venta (requerido)',
          requerida: true,
          tipo: 'decimal',
          valorMinimo: 0,
          formato: '0.00',
        },
        {
          nombre: 'stockMinimo',
          descripcion: 'Stock mínimo para alertas (opcional)',
          requerida: false,
          tipo: 'numero',
          valorMinimo: 0,
          valorMaximo: 999999,
        },
        {
          nombre: 'tipoProducto',
          descripcion: 'Tipo de producto (opcional)',
          requerida: false,
          tipo: 'lista',
          valoresPermitidos: ['GENERICO', 'MEDICAMENTO', 'ALIMENTO', 'ROPA', 'ELECTRONICO'],
        },
        {
          nombre: 'unidad',
          descripcion: 'Unidad de medida (opcional)',
          requerida: false,
          tipo: 'lista',
          valoresPermitidos: ['UNIDAD', 'CAJA', 'KILOGRAMO', 'LITRO', 'METRO'],
        },
        {
          nombre: 'etiquetas',
          descripcion: 'Etiquetas separadas por comas (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 200,
        },
        {
          nombre: 'codigoBarras',
          descripcion: 'Código de barras (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 50,
        },
        {
          nombre: 'sku',
          descripcion: 'SKU del producto (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 50,
        },
      ],
      ejemplos: [
        {
          nombre: 'Paracetamol 500mg',
          descripcion: 'Analgésico y antipirético',
          stock: 150,
          precioCompra: 2.50,
          precioVenta: 5.00,
          stockMinimo: 20,
          tipoProducto: 'MEDICAMENTO',
          unidad: 'CAJA',
          etiquetas: 'Analgésico, Farmacia, Venta Libre',
          codigoBarras: '7501234567890',
          sku: 'PARA-500-001',
        },
        {
          nombre: 'Leche Entera 1L',
          descripcion: 'Leche entera pasteurizada',
          stock: 80,
          precioCompra: 15.00,
          precioVenta: 22.50,
          stockMinimo: 15,
          tipoProducto: 'ALIMENTO',
          unidad: 'LITRO',
          etiquetas: 'Lácteos, Refrigerado',
          codigoBarras: '7501234567891',
          sku: 'LECH-ENT-001',
        },
      ],
      validaciones: [
        {
          columna: 'nombre',
          tipo: 'requerido',
          mensaje: 'El nombre del producto es requerido',
        },
        {
          columna: 'stock',
          tipo: 'rango',
          mensaje: 'El stock debe ser un número entre 0 y 999,999',
          condicion: { min: 0, max: 999999 },
        },
        {
          columna: 'precioCompra',
          tipo: 'rango',
          mensaje: 'El precio de compra debe ser mayor a 0',
          condicion: { min: 0 },
        },
        {
          columna: 'precioVenta',
          tipo: 'rango',
          mensaje: 'El precio de venta debe ser mayor a 0',
          condicion: { min: 0 },
        },
      ],
    };

    return await this.generarPlantillaExcel(config, 'productos');
  }

  /**
   * Genera una plantilla de Excel para proveedores
   */
  async generarPlantillaProveedores(): Promise<string> {
    const config: PlantillaConfig = {
      nombre: 'Plantilla de Proveedores',
      descripcion: 'Plantilla para importar proveedores al sistema',
      columnas: [
        {
          nombre: 'nombre',
          descripcion: 'Nombre del proveedor (requerido)',
          requerida: true,
          tipo: 'texto',
          longitudMaxima: 100,
          longitudMinima: 2,
        },
        {
          nombre: 'email',
          descripcion: 'Email del proveedor (opcional)',
          requerida: false,
          tipo: 'email',
          longitudMaxima: 100,
        },
        {
          nombre: 'telefono',
          descripcion: 'Teléfono del proveedor (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 20,
        },
      ],
      ejemplos: [
        {
          nombre: 'Distribuidora ABC',
          email: 'contacto@distribuidoraabc.com',
          telefono: '555-123-4567',
        },
        {
          nombre: 'Proveedor XYZ',
          email: 'ventas@proveedorxyz.com',
          telefono: '555-987-6543',
        },
      ],
      validaciones: [
        {
          columna: 'nombre',
          tipo: 'requerido',
          mensaje: 'El nombre del proveedor es requerido',
        },
        {
          columna: 'email',
          tipo: 'formato',
          mensaje: 'El email debe tener un formato válido',
          condicion: 'email',
        },
      ],
    };

    return await this.generarPlantillaExcel(config, 'proveedores');
  }

  /**
   * Genera una plantilla de Excel para movimientos
   */
  async generarPlantillaMovimientos(): Promise<string> {
    const config: PlantillaConfig = {
      nombre: 'Plantilla de Movimientos',
      descripcion: 'Plantilla para importar movimientos de inventario',
      columnas: [
        {
          nombre: 'productoNombre',
          descripcion: 'Nombre del producto (requerido)',
          requerida: true,
          tipo: 'texto',
          longitudMaxima: 100,
        },
        {
          nombre: 'codigoBarras',
          descripcion: 'Código de barras del producto (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 50,
        },
        {
          nombre: 'tipo',
          descripcion: 'Tipo de movimiento: ENTRADA o SALIDA (requerido)',
          requerida: true,
          tipo: 'lista',
          valoresPermitidos: ['ENTRADA', 'SALIDA'],
        },
        {
          nombre: 'cantidad',
          descripcion: 'Cantidad del movimiento (requerido)',
          requerida: true,
          tipo: 'numero',
          valorMinimo: 1,
          valorMaximo: 999999,
        },
        {
          nombre: 'fecha',
          descripcion: 'Fecha del movimiento (requerido)',
          requerida: true,
          tipo: 'fecha',
          formato: 'YYYY-MM-DD',
        },
        {
          nombre: 'motivo',
          descripcion: 'Motivo del movimiento (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 200,
        },
        {
          nombre: 'descripcion',
          descripcion: 'Descripción adicional (opcional)',
          requerida: false,
          tipo: 'texto',
          longitudMaxima: 500,
        },
      ],
      ejemplos: [
        {
          productoNombre: 'Paracetamol 500mg',
          codigoBarras: '7501234567890',
          tipo: 'ENTRADA',
          cantidad: 50,
          fecha: '2024-01-15',
          motivo: 'Compra a proveedor',
          descripcion: 'Lote 2024-001',
        },
        {
          productoNombre: 'Leche Entera 1L',
          codigoBarras: '7501234567891',
          tipo: 'SALIDA',
          cantidad: 10,
          fecha: '2024-01-16',
          motivo: 'Venta',
          descripcion: 'Venta al cliente',
        },
      ],
      validaciones: [
        {
          columna: 'productoNombre',
          tipo: 'requerido',
          mensaje: 'El nombre del producto es requerido',
        },
        {
          columna: 'tipo',
          tipo: 'lista',
          mensaje: 'El tipo debe ser ENTRADA o SALIDA',
          condicion: ['ENTRADA', 'SALIDA'],
        },
        {
          columna: 'cantidad',
          tipo: 'rango',
          mensaje: 'La cantidad debe ser mayor a 0',
          condicion: { min: 1 },
        },
        {
          columna: 'fecha',
          tipo: 'formato',
          mensaje: 'La fecha debe tener formato YYYY-MM-DD',
          condicion: 'YYYY-MM-DD',
        },
      ],
    };

    return await this.generarPlantillaExcel(config, 'movimientos');
  }

  /**
   * Genera un archivo Excel con la plantilla especificada
   */
  private async generarPlantillaExcel(config: PlantillaConfig, tipo: string): Promise<string> {
    try {
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Instrucciones
      const instrucciones = this.generarInstrucciones(config);
      const worksheetInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
      XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'Instrucciones');

      // Hoja 2: Plantilla con datos de ejemplo
      const datosPlantilla = this.generarDatosPlantilla(config);
      const worksheetPlantilla = XLSX.utils.json_to_sheet(datosPlantilla);
      XLSX.utils.book_append_sheet(workbook, worksheetPlantilla, 'Plantilla');

      // Hoja 3: Validaciones
      const validaciones = this.generarHojaValidaciones(config);
      const worksheetValidaciones = XLSX.utils.aoa_to_sheet(validaciones);
      XLSX.utils.book_append_sheet(workbook, worksheetValidaciones, 'Validaciones');

      // Generar nombre de archivo
      const timestamp = new Date().toISOString().split('T')[0];
      const nombreArchivo = `plantilla-${tipo}-${timestamp}.xlsx`;
      const rutaArchivo = path.join(this.directorioPlantillas, nombreArchivo);

      // Guardar archivo
      XLSX.writeFile(workbook, rutaArchivo);

      this.logger.log(`✅ Plantilla generada: ${rutaArchivo}`);
      return nombreArchivo;

    } catch (error) {
      this.logger.error(`❌ Error generando plantilla ${tipo}:`, error);
      throw new Error(`Error generando plantilla: ${error.message}`);
    }
  }

  /**
   * Genera las instrucciones para la plantilla
   */
  private generarInstrucciones(config: PlantillaConfig): any[][] {
    return [
      [config.nombre],
      [''],
      [config.descripcion],
      [''],
      ['INSTRUCCIONES:'],
      ['1. Complete los datos en la hoja "Plantilla"'],
      ['2. No modifique los encabezados de las columnas'],
      ['3. Siga el formato de los ejemplos proporcionados'],
      ['4. Revise la hoja "Validaciones" para conocer las reglas'],
      ['5. Guarde el archivo y súbalo al sistema'],
      [''],
      ['COLUMNAS REQUERIDAS:'],
      ...config.columnas
        .filter(col => col.requerida)
        .map(col => [`- ${col.nombre}: ${col.descripcion}`]),
      [''],
      ['COLUMNAS OPCIONALES:'],
      ...config.columnas
        .filter(col => !col.requerida)
        .map(col => [`- ${col.nombre}: ${col.descripcion}`]),
    ];
  }

  /**
   * Genera los datos de ejemplo para la plantilla
   */
  private generarDatosPlantilla(config: PlantillaConfig): any[] {
    // Agregar encabezados como primera fila
    const encabezados = config.columnas.map(col => col.nombre);
    const datos = [encabezados];

    // Agregar ejemplos
    config.ejemplos.forEach(ejemplo => {
      const fila = config.columnas.map(col => ejemplo[col.nombre] || '');
      datos.push(fila);
    });

    // Agregar filas vacías para que el usuario complete
    for (let i = 0; i < 5; i++) {
      const filaVacia = config.columnas.map(() => '');
      datos.push(filaVacia);
    }

    return datos;
  }

  /**
   * Genera la hoja de validaciones
   */
  private generarHojaValidaciones(config: PlantillaConfig): any[][] {
    const validaciones = [
      ['VALIDACIONES Y REGLAS'],
      [''],
      ['COLUMNA', 'TIPO', 'REQUERIDA', 'REGLAS', 'EJEMPLO'],
    ];

    config.columnas.forEach(col => {
      let reglas = '';
      let ejemplo = '';

      if (col.requerida) {
        reglas += 'Requerido. ';
      }

      switch (col.tipo) {
        case 'texto':
          reglas += `Texto`;
          if (col.longitudMinima) reglas += ` (mín ${col.longitudMinima} caracteres)`;
          if (col.longitudMaxima) reglas += ` (máx ${col.longitudMaxima} caracteres)`;
          ejemplo = 'Ejemplo de texto';
          break;
        case 'numero':
          reglas += `Número entero`;
          if (col.valorMinimo !== undefined) reglas += ` (mín ${col.valorMinimo})`;
          if (col.valorMaximo !== undefined) reglas += ` (máx ${col.valorMaximo})`;
          ejemplo = '123';
          break;
        case 'decimal':
          reglas += `Número decimal`;
          if (col.valorMinimo !== undefined) reglas += ` (mín ${col.valorMinimo})`;
          if (col.valorMaximo !== undefined) reglas += ` (máx ${col.valorMaximo})`;
          ejemplo = '123.45';
          break;
        case 'fecha':
          reglas += `Fecha (${col.formato})`;
          ejemplo = '2024-01-15';
          break;
        case 'email':
          reglas += 'Email válido';
          ejemplo = 'usuario@ejemplo.com';
          break;
        case 'lista':
          reglas += `Valor de la lista: ${col.valoresPermitidos?.join(', ')}`;
          ejemplo = col.valoresPermitidos?.[0] || '';
          break;
      }

      validaciones.push([col.nombre, col.tipo, col.requerida ? 'Sí' : 'No', reglas, ejemplo]);
    });

    return validaciones;
  }

  /**
   * Asegura que el directorio de plantillas existe
   */
  private asegurarDirectorioPlantillas(): void {
    if (!fs.existsSync(this.directorioPlantillas)) {
      fs.mkdirSync(this.directorioPlantillas, { recursive: true });
      this.logger.log(`📁 Directorio de plantillas creado: ${this.directorioPlantillas}`);
    }
  }

  /**
   * Obtiene la ruta completa de una plantilla
   */
  obtenerRutaPlantilla(nombreArchivo: string): string {
    return path.join(this.directorioPlantillas, nombreArchivo);
  }

  /**
   * Lista todas las plantillas disponibles
   */
  listarPlantillas(): string[] {
    try {
      if (!fs.existsSync(this.directorioPlantillas)) {
        return [];
      }

      const archivos = fs.readdirSync(this.directorioPlantillas);
      return archivos.filter(archivo => 
        archivo.endsWith('.xlsx') && archivo.startsWith('plantilla-')
      );
    } catch (error) {
      this.logger.error('Error listando plantillas:', error);
      return [];
    }
  }
} 