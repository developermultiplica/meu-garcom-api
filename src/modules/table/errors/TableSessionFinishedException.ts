import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class TableSessionFinishedException extends NestUnauthorizedException {
  constructor() {
    super('Essa sessão da mesa já foi finalizada');
  }
}
