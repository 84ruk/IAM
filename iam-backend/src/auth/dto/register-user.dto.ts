import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterUserDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, {
    message: 'El nombre contiene caracteres no permitidos',
  })
  nombre: string;

  @IsEmail()
  email: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
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
}
