import { BadRequestException } from '@nestjs/common';

export class ProductNotFoundException extends BadRequestException {
  constructor() {
    super('Produto não foi encontrado');
  }
}
