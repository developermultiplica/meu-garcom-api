import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class WaiterNotFoundException extends NestUnauthorizedException {
  constructor() {
    super('Garçom não foi encontrada');
  }
}
