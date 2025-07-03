import { 
  IsOptional, 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsEmail 
} from 'class-validator';

export class CreateEmpresaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, { 
    message: 'El nombre contiene caracteres no permitidos' 
  })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El RFC debe ser un texto' })
  @MaxLength(13, { message: 'El RFC no puede exceder 13 caracteres' })
  @Matches(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, { 
    message: 'El RFC debe tener un formato válido' 
  })
  rfc?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email de contacto debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  emailContacto?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  @MaxLength(500, { message: 'La dirección no puede exceder 500 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()#]+$/, { 
    message: 'La dirección contiene caracteres no permitidos' 
  })
  direccion?: string;
}
