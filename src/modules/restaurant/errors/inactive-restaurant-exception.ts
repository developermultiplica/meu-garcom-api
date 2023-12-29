import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class InactiveRestaurantException extends NestUnauthorizedException {
  constructor() {
    super('Este estabelecimento não está ativo');
  }
}
