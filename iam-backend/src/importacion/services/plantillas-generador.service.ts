import { Injectable, Logger } from '@nestjs/common';
import { TipoImportacionUnificada } from '../dto/importacion-unificada.dto';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface PlantillaMetadata {
  tipo: TipoImportacionUnificada;
  nombre: string;
  descripcion: string;
  version: string;
  fechaCreacion: string;
  columnasRequeridas: string[];
  columnasOpcionales: string[];
  ejemplos: any[];
  instrucciones: string[];
  validaciones: string[];
}

export interface DatosEjemplo {
  [key: string]: any;
}

@Injectable()
export class PlantillasGeneradorService {
  private readonly logger = new Logger(PlantillasGeneradorService.name);
  private readonly plantillasDir = path.join(process.cwd(), 'uploads', 'plantillas');

  constructor() {
    this.inicializarDirectorio();
  }

  private async inicializarDirectorio(): Promise<void> {
    try {
      await fs.mkdir(this.plantillasDir, { recursive: true });
      this.logger.log('📁 Directorio de plantillas inicializado');
    } catch (error) {
      this.logger.error('Error creando directorio de plantillas:', error);
    }
  }

  /**
   * Genera una plantilla Excel para el tipo de importación especificado
   */
  async generarPlantilla(tipo: TipoImportacionUnificada): Promise<string> {
    this.logger.log(`🏗️ Generando plantilla para: ${tipo}`);

    const metadata = this.obtenerMetadataPlantilla(tipo);
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Datos (donde el usuario ingresará la información)
    const hojaDatos = this.crearHojaDatos(metadata);
    XLSX.utils.book_append_sheet(workbook, hojaDatos, 'Datos');

    // Hoja 2: Instrucciones
    const hojaInstrucciones = this.crearHojaInstrucciones(metadata);
    XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, 'Instrucciones');

    // Hoja 3: Ejemplos
    const hojaEjemplos = this.crearHojaEjemplos(metadata);
    XLSX.utils.book_append_sheet(workbook, hojaEjemplos, 'Ejemplos');

    // Hoja 4: Validaciones
    const hojaValidaciones = this.crearHojaValidaciones(metadata);
    XLSX.utils.book_append_sheet(workbook, hojaValidaciones, 'Validaciones');

    // Guardar archivo
    const nombreArchivo = `plantilla_${tipo}_${Date.now()}.xlsx`;
    const rutaArchivo = path.join(this.plantillasDir, nombreArchivo);
    
    XLSX.writeFile(workbook, rutaArchivo);
    this.logger.log(`✅ Plantilla generada: ${nombreArchivo}`);

    return nombreArchivo;
  }

  /**
   * Obtiene metadata específica para cada tipo de importación
   */
  private obtenerMetadataPlantilla(tipo: TipoImportacionUnificada): PlantillaMetadata {
    const fechaCreacion = new Date().toISOString().split('T')[0];

    switch (tipo) {
      case TipoImportacionUnificada.PRODUCTOS:
        return {
          tipo,
          nombre: 'Plantilla de Productos',
          descripcion: 'Plantilla para importar productos al inventario',
          version: '1.0',
          fechaCreacion,
          columnasRequeridas: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
          columnasOpcionales: [
            'descripcion', 'stockMinimo', 'categoria', 'proveedor', 'codigoBarras', 
            'unidadMedida', 'ubicacion', 'fechaVencimiento', 'lote', 'notas',
            'sku', 'color', 'talla', 'tipoProducto', 'temperaturaOptima', 'humedadOptima'
          ],
          ejemplos: [
            {
              nombre: 'Laptop HP Pavilion',
              descripcion: 'Laptop para oficina con Windows 11',
              stock: 15,
              precioCompra: 12000.00,
              precioVenta: 15000.00,
              stockMinimo: 5,
              categoria: 'Tecnología',
              proveedor: 'HP Distribuidor',
              codigoBarras: '123456789012',
              unidadMedida: 'UNIDAD',
              ubicacion: 'A1-B2',
              sku: 'HP-PAV-001',
              tipoProducto: 'ELECTRONICO'
            },
            {
              nombre: 'Aceite de Oliva Extra Virgen',
              descripcion: 'Aceite de oliva premium 500ml',
              stock: 50,
              precioCompra: 85.50,
              precioVenta: 120.00,
              stockMinimo: 10,
              categoria: 'Alimentos',
              proveedor: 'Distribuidora Gourmet',
              codigoBarras: '987654321098',
              unidadMedida: 'UNIDAD',
              ubicacion: 'C3-D1',
              fechaVencimiento: '2025-12-31',
              lote: 'LT-2024-001',
              tipoProducto: 'ALIMENTO',
              temperaturaOptima: 18,
              humedadOptima: 60
            }
          ],
          instrucciones: [
            '1. Complete las columnas marcadas como REQUERIDAS',
            '2. Las columnas opcionales pueden dejarse vacías',
            '3. Use formatos de fecha YYYY-MM-DD',
            '4. Los precios deben ser números decimales',
            '5. Stock debe ser un número entero',
            '6. Unidad de medida: UNIDAD, KILO, LITRO, CAJA, PAQUETE, METRO, GRAMO, MILILITRO, CENTIMETRO',
            '7. Tipo de producto: GENERICO, MEDICAMENTO, ALIMENTO, ROPA, ELECTRONICO',
            '8. No deje filas vacías entre productos',
            '9. Máximo 10,000 productos por archivo'
          ],
          validaciones: [
            'nombre: Texto obligatorio, máximo 100 caracteres',
            'stock: Número entero no negativo',
            'precioCompra: Número decimal positivo',
            'precioVenta: Número decimal positivo',
            'stockMinimo: Número entero no negativo (opcional)',
            'codigoBarras: Texto único, máximo 50 caracteres',
            'sku: Texto único, máximo 50 caracteres',
            'temperaturaOptima: Número entre -50 y 100',
            'humedadOptima: Número entre 0 y 100'
          ]
        };

      case TipoImportacionUnificada.PROVEEDORES:
        return {
          tipo,
          nombre: 'Plantilla de Proveedores',
          descripcion: 'Plantilla para importar proveedores',
          version: '1.0',
          fechaCreacion,
          columnasRequeridas: ['nombre'],
          columnasOpcionales: [
            'email', 'telefono', 'direccion', 'ciudad', 'pais', 
            'codigoPostal', 'ruc', 'contacto', 'sitioWeb', 'notas'
          ],
          ejemplos: [
            {
              nombre: 'Distribuidora ABC S.A.',
              email: 'ventas@abc.com',
              telefono: '+52-555-123-4567',
              direccion: 'Av. Principal 123',
              ciudad: 'Ciudad de México',
              pais: 'México',
              codigoPostal: '01234',
              ruc: 'ABC123456789',
              contacto: 'Juan Pérez',
              sitioWeb: 'www.abc.com',
              notas: 'Proveedor principal de tecnología'
            },
            {
              nombre: 'Alimentos Frescos Ltd.',
              email: 'pedidos@frescos.com',
              telefono: '+52-555-987-6543',
              direccion: 'Calle Comercio 456',
              ciudad: 'Guadalajara',
              pais: 'México',
              codigoPostal: '44100',
              contacto: 'María García',
              notas: 'Especialista en productos perecederos'
            }
          ],
          instrucciones: [
            '1. El nombre del proveedor es obligatorio',
            '2. Email debe tener formato válido',
            '3. Teléfono puede incluir código de país',
            '4. RUC debe ser único si se proporciona',
            '5. No deje filas vacías entre proveedores',
            '6. Máximo 5,000 proveedores por archivo'
          ],
          validaciones: [
            'nombre: Texto obligatorio, máximo 100 caracteres, único',
            'email: Formato de email válido (opcional)',
            'telefono: Texto, máximo 20 caracteres',
            'ruc: Texto único, máximo 20 caracteres',
            'direccion: Texto, máximo 200 caracteres',
            'codigoPostal: Texto, máximo 10 caracteres'
          ]
        };

      case TipoImportacionUnificada.MOVIMIENTOS:
        return {
          tipo,
          nombre: 'Plantilla de Movimientos',
          descripcion: 'Plantilla para importar movimientos de inventario',
          version: '1.0',
          fechaCreacion,
          columnasRequeridas: ['fecha', 'tipo', 'producto', 'cantidad'],
          columnasOpcionales: ['motivo', 'precio', 'referencia', 'proveedor', 'notas'],
          ejemplos: [
            {
              fecha: '2024-08-07',
              tipo: 'entrada',
              producto: 'Laptop HP Pavilion',
              cantidad: 10,
              precio: 12000.00,
              motivo: 'Compra a proveedor',
              referencia: 'FACT-001',
              proveedor: 'HP Distribuidor',
              notas: 'Entrada de nueva mercancía'
            },
            {
              fecha: '2024-08-07',
              tipo: 'salida',
              producto: 'Aceite de Oliva Extra Virgen',
              cantidad: 5,
              precio: 120.00,
              motivo: 'Venta',
              referencia: 'VEN-001',
              notas: 'Venta al cliente ABC'
            },
            {
              fecha: '2024-08-07',
              tipo: 'ajuste',
              producto: 'Laptop HP Pavilion',
              cantidad: -1,
              motivo: 'Producto dañado',
              referencia: 'AJ-001',
              notas: 'Ajuste por daño en el producto'
            }
          ],
          instrucciones: [
            '1. Fecha debe estar en formato YYYY-MM-DD',
            '2. Tipo debe ser: entrada, salida, o ajuste',
            '3. Producto debe coincidir con nombre exacto en inventario',
            '4. Cantidad puede ser positiva o negativa según el tipo',
            '5. Precio es opcional pero recomendado',
            '6. No deje filas vacías entre movimientos',
            '7. Máximo 10,000 movimientos por archivo'
          ],
          validaciones: [
            'fecha: Formato YYYY-MM-DD obligatorio',
            'tipo: Debe ser "entrada", "salida" o "ajuste"',
            'producto: Texto obligatorio, debe existir en inventario',
            'cantidad: Número entero, puede ser negativo para ajustes',
            'precio: Número decimal positivo (opcional)',
            'referencia: Texto único, máximo 50 caracteres'
          ]
        };

      default:
        throw new Error(`Tipo de importación no soportado: ${tipo}`);
    }
  }

  /**
   * Crea la hoja principal de datos con encabezados
   */
  private crearHojaDatos(metadata: PlantillaMetadata): XLSX.WorkSheet {
    const encabezados = [
      ...metadata.columnasRequeridas.map(col => `${col} *`),
      ...metadata.columnasOpcionales
    ];

    const datos = [encabezados];
    const worksheet = XLSX.utils.aoa_to_sheet(datos);

    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    
    // Hacer los encabezados requeridos en negrita y con color
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      
      const esRequerido = encabezados[C].includes('*');
      worksheet[address].s = {
        font: { bold: true, color: { rgb: esRequerido ? "FF0000" : "000000" } },
        fill: { fgColor: { rgb: esRequerido ? "FFE6E6" : "E6F3FF" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }

    // Ajustar ancho de columnas
    const colWidths = encabezados.map(header => ({ wch: Math.max(header.length + 2, 12) }));
    worksheet['!cols'] = colWidths;

    return worksheet;
  }

  /**
   * Crea la hoja de instrucciones
   */
  private crearHojaInstrucciones(metadata: PlantillaMetadata): XLSX.WorkSheet {
    const datos = [
      ['INSTRUCCIONES DE USO'],
      [''],
      [`Plantilla: ${metadata.nombre}`],
      [`Versión: ${metadata.version}`],
      [`Fecha: ${metadata.fechaCreacion}`],
      [''],
      ['DESCRIPCIÓN:'],
      [metadata.descripcion],
      [''],
      ['COLUMNAS REQUERIDAS (obligatorias):'],
      ...metadata.columnasRequeridas.map(col => [`• ${col}`]),
      [''],
      ['COLUMNAS OPCIONALES:'],
      ...metadata.columnasOpcionales.map(col => [`• ${col}`]),
      [''],
      ['INSTRUCCIONES PASO A PASO:'],
      ...metadata.instrucciones.map(inst => [inst]),
      [''],
      ['IMPORTANTE:'],
      ['• No modifique los nombres de las columnas'],
      ['• No elimine las hojas de ejemplo e instrucciones'],
      ['• Guarde el archivo en formato Excel (.xlsx)'],
      ['• Revise la hoja de Validaciones para detalles específicos']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(datos);

    // Estilos para el título
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, size: 16, color: { rgb: "000080" } },
        alignment: { horizontal: "center" }
      };
    }

    // Ancho de columnas
    worksheet['!cols'] = [{ wch: 80 }];

    return worksheet;
  }

  /**
   * Crea la hoja de ejemplos con datos de muestra
   */
  private crearHojaEjemplos(metadata: PlantillaMetadata): XLSX.WorkSheet {
    const encabezados = [
      ...metadata.columnasRequeridas,
      ...metadata.columnasOpcionales
    ];

    const datos = [
      ['EJEMPLOS DE DATOS'],
      [''],
      encabezados,
      ...metadata.ejemplos.map(ejemplo => 
        encabezados.map(col => ejemplo[col] || '')
      )
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(datos);

    // Estilo para el título
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, size: 14, color: { rgb: "008000" } }
      };
    }

    // Estilo para encabezados de ejemplo (fila 3)
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 2, c: C });
        if (worksheet[address]) {
          worksheet[address].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "F0F8FF" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }
      }
    }

    // Ancho de columnas
    const colWidths = encabezados.map(header => ({ wch: Math.max(header.length + 2, 15) }));
    worksheet['!cols'] = colWidths;

    return worksheet;
  }

  /**
   * Crea la hoja de validaciones
   */
  private crearHojaValidaciones(metadata: PlantillaMetadata): XLSX.WorkSheet {
    const datos = [
      ['REGLAS DE VALIDACIÓN'],
      [''],
      ['Campo', 'Reglas de Validación'],
      ...metadata.validaciones.map(validacion => {
        const [campo, reglas] = validacion.split(': ');
        return [campo, reglas];
      }),
      [''],
      ['CÓDIGOS DE ERROR COMUNES:'],
      ['VALID_001', 'Campo requerido vacío'],
      ['VALID_002', 'Formato de dato incorrecto'],
      ['VALID_003', 'Valor fuera de rango permitido'],
      ['VALID_004', 'Valor duplicado en campo único'],
      ['VALID_005', 'Referencia no encontrada'],
      [''],
      ['CONSEJOS:'],
      ['• Verifique que los datos coincidan con el formato especificado'],
      ['• Use la hoja de Ejemplos como referencia'],
      ['• Evite caracteres especiales no permitidos'],
      ['• Mantenga consistencia en el formato de fechas y números']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(datos);

    // Estilo para el título
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, size: 14, color: { rgb: "800080" } }
      };
    }

    // Estilo para encabezados de tabla
    if (worksheet['A3'] && worksheet['B3']) {
      worksheet['A3'].s = worksheet['B3'].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F5F5DC" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }

    // Ancho de columnas
    worksheet['!cols'] = [{ wch: 20 }, { wch: 60 }];

    return worksheet;
  }

  /**
   * Obtiene lista de plantillas disponibles
   */
  async obtenerPlantillasDisponibles(): Promise<Array<{
    tipo: TipoImportacionUnificada;
    nombre: string;
    descripcion: string;
  }>> {
    return [
      {
        tipo: TipoImportacionUnificada.PRODUCTOS,
        nombre: 'Plantilla de Productos',
        descripcion: 'Para importar productos al inventario'
      },
      {
        tipo: TipoImportacionUnificada.PROVEEDORES,
        nombre: 'Plantilla de Proveedores',
        descripcion: 'Para importar proveedores'
      },
      {
        tipo: TipoImportacionUnificada.MOVIMIENTOS,
        nombre: 'Plantilla de Movimientos',
        descripcion: 'Para importar movimientos de inventario'
      }
    ];
  }

  /**
   * Obtiene la ruta de una plantilla generada
   */
  obtenerRutaPlantilla(nombreArchivo: string): string {
    return path.join(this.plantillasDir, nombreArchivo);
  }

  /**
   * Elimina plantillas antiguas (cleanup)
   */
  async limpiarPlantillasAntiguas(diasMaximos: number = 7): Promise<void> {
    try {
      const archivos = await fs.readdir(this.plantillasDir);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasMaximos);

      for (const archivo of archivos) {
        const rutaArchivo = path.join(this.plantillasDir, archivo);
        const stats = await fs.stat(rutaArchivo);
        
        if (stats.mtime < fechaLimite) {
          await fs.unlink(rutaArchivo);
          this.logger.log(`🗑️ Plantilla antigua eliminada: ${archivo}`);
        }
      }
    } catch (error) {
      this.logger.error('Error limpiando plantillas antiguas:', error);
    }
  }
}
