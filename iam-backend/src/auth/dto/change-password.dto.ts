import {
  IsString,
  MinLength,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString()
  @MinLength(12, {
    message: 'La nueva contraseña debe tener al menos 12 caracteres',
  })
  @MaxLength(128, {
    message: 'La nueva contraseña no puede exceder 128 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    {
      message:
        'La nueva contraseña debe contener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos (@$!%*?&)',
    },
  )
  newPassword: string;

  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @IsString()
  confirmPassword: string;
}
