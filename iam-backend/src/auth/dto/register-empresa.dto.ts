// auth/dto/register-empresa.dto.ts
import { IsEmail, IsNotEmpty, IsString, isString, MinLength } from 'class-validator';

export class RegisterEmpresaDto {
  @IsNotEmpty()
  nombreEmpresa: string;

  @IsEmail()
  email: string;

  @IsString()
  industria: string;

  @IsNotEmpty()
  nombreUsuario: string;

  @MinLength(6)
  password: string;
}
