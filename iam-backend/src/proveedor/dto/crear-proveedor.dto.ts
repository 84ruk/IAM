import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';

export class CrearProveedorDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, {
    message: 'El nombre contiene caracteres no permitidos',
  })
  nombre: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @Matches(/^[\+]?[0-9\s\-\(\)]+$/, {
    message: 'El teléfono contiene caracteres no permitidos',
  })
  telefono?: string;
}
