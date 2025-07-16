import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Rol } from '@prisma/client';

export class CreateUserAdminDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    {
      message:
        'La contraseña debe contener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos (@$!%*?&)',
    },
  )
  password: string;

  @IsEnum(Rol, { message: 'El rol debe ser válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol: Rol;

  @IsOptional()
  @IsString()
  empresaId?: string;
}
