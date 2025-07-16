import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarMovimientoCommand {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
