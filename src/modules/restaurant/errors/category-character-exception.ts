/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';

export class CategoryCharacterException extends BadRequestException {
  constructor() {
    super('Categoria contém apenas um único caractere');
  }
}
