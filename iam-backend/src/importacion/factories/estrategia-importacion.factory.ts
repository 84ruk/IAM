import { Injectable } from '@nestjs/common';
import { EstrategiaImportacion } from '../dto/estrategias/base-estrategia.interface';
import { ProductosEstrategia } from '../dto/estrategias/productos-estrategia';
import { ProveedoresEstrategia } from '../dto/estrategias/proveedores-estrategia';
import { MovimientosEstrategia } from '../dto/estrategias/movimientos-estrategia';
import { TipoImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

@Injectable()
export class EstrategiaImportacionFactory {
  constructor(
    private readonly productosEstrategia: ProductosEstrategia,
    private readonly proveedoresEstrategia: ProveedoresEstrategia,
    private readonly movimientosEstrategia: MovimientosEstrategia,
  ) {}

  /**
   * Crea la estrategia apropiada según el tipo de importación
   */
  crearEstrategia(tipo: TipoImportacion): EstrategiaImportacion {
    switch (tipo) {
      case TipoImportacion.PRODUCTOS:
        return this.productosEstrategia;
      case TipoImportacion.PROVEEDORES:
        return this.proveedoresEstrategia;
      case TipoImportacion.MOVIMIENTOS:
        return this.movimientosEstrategia;
      default:
        throw new Error(`Tipo de importación no soportado: ${tipo}`);
    }
  }

  /**
   * Obtiene todas las estrategias disponibles
   */
  obtenerTodasLasEstrategias(): EstrategiaImportacion[] {
    return [
      this.productosEstrategia,
      this.proveedoresEstrategia,
      this.movimientosEstrategia,
    ];
  }

  /**
   * Verifica si un tipo de importación es soportado
   */
  esTipoSoportado(tipo: string): boolean {
    return Object.values(TipoImportacion).includes(tipo as TipoImportacion);
  }

  /**
   * Obtiene información de todas las estrategias disponibles
   */
  obtenerInformacionEstrategias(): Array<{
    tipo: string;
    nombre: string;
    columnasRequeridas: string[];
    columnasOpcionales: string[];
    configuracion: any;
  }> {
    return this.obtenerTodasLasEstrategias().map(estrategia => ({
      tipo: estrategia.tipo,
      nombre: estrategia.nombre,
      columnasRequeridas: estrategia.obtenerColumnasRequeridas(),
      columnasOpcionales: estrategia.obtenerColumnasOpcionales(),
      configuracion: estrategia.obtenerConfiguracionProcesamiento(),
    }));
  }
} 