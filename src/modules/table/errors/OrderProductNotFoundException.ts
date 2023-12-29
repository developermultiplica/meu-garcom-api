import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class OrderProductNotFoundException extends NestUnauthorizedException {
  constructor() {
    super('O produto do pedido não foi encontrada');
  }
}
