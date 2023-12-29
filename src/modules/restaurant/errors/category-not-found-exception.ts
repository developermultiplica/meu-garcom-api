import { BadRequestException } from '@nestjs/common';

export class CategoryNotFoundException extends BadRequestException {
  constructor() {
    super('Categoria não foi encontrada');
  }
}
