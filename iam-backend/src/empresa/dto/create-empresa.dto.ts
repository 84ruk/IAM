import { IsOptional, IsString } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  emailContacto?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}
