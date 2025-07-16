import { Rol } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  password?: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsString()
  empresaId: string;
}
