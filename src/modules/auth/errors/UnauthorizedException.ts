import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class UnauthorizedException extends NestUnauthorizedException {
  constructor() {
    super('Você não possui permissão para acessar essa rota');
  }
}
