import { BadRequestException } from '@nestjs/common';

export class RestaurantNotFoundException extends BadRequestException {
  constructor() {
    super('Restaurante não foi encontrado');
  }
}
