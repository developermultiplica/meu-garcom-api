import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class TableNotFoundException extends NestUnauthorizedException {
  constructor() {
    super('A mesa não foi encontrada');
  }
}
