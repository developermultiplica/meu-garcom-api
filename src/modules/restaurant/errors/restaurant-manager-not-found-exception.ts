import { BadRequestException } from '@nestjs/common';

export class RestaurantManagerNotFoundException extends BadRequestException {
  constructor() {
    super('Gerente do estabelecimento não foi encontrado');
  }
}
