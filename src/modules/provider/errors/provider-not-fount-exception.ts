import { BadRequestException } from '@nestjs/common';

export class ProviderNotFoundException extends BadRequestException {
  constructor() {
    super('Provedor não foi encontrado');
  }
}
