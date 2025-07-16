import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Rol } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password?: string;

  @IsOptional()
  @IsEnum(Rol, { message: 'El rol debe ser válido' })
  rol?: Rol;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}
