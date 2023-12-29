import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class MaxTablesExcepion extends NestUnauthorizedException {
  constructor() {
    super('Número máximo de mesas atingido!');
  }
}
