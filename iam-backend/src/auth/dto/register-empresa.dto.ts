// auth/dto/register-empresa.dto.ts
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches,
  IsEnum
} from 'class-validator';

// Enum para industrias válidas
export enum IndustriaValida {
  ALIMENTOS = 'ALIMENTOS',
  ROPA = 'ROPA',
  ELECTRONICA = 'ELECTRONICA',
  GENERICA = 'GENERICA',
  FARMACIA = 'FARMACIA'
}

export class RegisterEmpresaDto {
  @IsString({ message: 'El nombre de la empresa debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  @MinLength(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la empresa no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, { 
    message: 'El nombre de la empresa contiene caracteres no permitidos' 
  })
  nombreEmpresa: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  email: string;

  @IsEnum(IndustriaValida, { message: 'La industria debe ser una de las opciones válidas' })
  industria: IndustriaValida;

  @IsString({ message: 'El nombre del usuario debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del usuario es requerido' })
  @MinLength(2, { message: 'El nombre del usuario debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre del usuario no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, { 
    message: 'El nombre del usuario contiene caracteres no permitidos' 
  })
  nombreUsuario: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/, {
    message: 'La contraseña debe contener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos (@$!%*?&)'
  })
  password: string;
}
