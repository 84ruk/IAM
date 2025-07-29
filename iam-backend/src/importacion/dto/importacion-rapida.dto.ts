import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum TipoImportacionRapida {
  PRODUCTOS = 'productos',
  PROVEEDORES = 'proveedores',
  MOVIMIENTOS = 'movimientos',
  PEDIDOS = 'pedidos',
  CATEGORIAS = 'categorias',
  ETIQUETAS = 'etiquetas',
}

export class ImportacionRapidaDto {
  @IsEnum(TipoImportacionRapida)
  tipo: TipoImportacionRapida;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export interface ResultadoImportacionRapida {
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  errores: Array<{
    fila: number;
    columna: string;
    valor: string;
    mensaje: string;
  }>;
  archivoErrores?: string;
  resumen: {
    tipo: string;
    empresaId: string;
    usuarioId: string;
    fechaProcesamiento: Date;
  };
} 