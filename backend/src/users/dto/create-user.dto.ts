import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Rol } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsString()
  empresaId: string; 
}
