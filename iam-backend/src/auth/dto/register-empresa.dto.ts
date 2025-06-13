// auth/dto/register-empresa.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterEmpresaDto {
  @IsNotEmpty()
  nombreEmpresa: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  nombreUsuario: string;

  @MinLength(6)
  password: string;
}
