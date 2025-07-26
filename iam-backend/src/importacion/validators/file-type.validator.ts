import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileTypeValidator implements PipeTransform {
  private readonly allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/x-iwork-numbers-sffnumbers', // .numbers (Mac Numbers)
    'text/csv', // .csv
    'application/csv', // .csv (alternativo)
  ];

  private readonly allowedExtensions = ['.xlsx', '.xls', '.numbers', '.csv'];

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }

    // Validar por MIME type
    const isValidMimeType = this.allowedMimeTypes.includes(file.mimetype);
    
    // Validar por extensión
    const fileExtension = this.getFileExtension(file.originalname);
    const isValidExtension = this.allowedExtensions.includes(fileExtension.toLowerCase());

    if (!isValidMimeType && !isValidExtension) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos permitidos: ${this.allowedExtensions.join(', ')}. ` +
        `Archivo recibido: ${file.originalname} (${file.mimetype})`
      );
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }
} 