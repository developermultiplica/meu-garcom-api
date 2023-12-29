import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class TableSessionNotFoundException extends NestUnauthorizedException {
  constructor() {
    super('A sessão da mesa não foi encontrada');
  }
}
