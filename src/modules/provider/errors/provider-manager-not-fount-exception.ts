import { BadRequestException } from '@nestjs/common';

export class ProviderManagerNotFoundException extends BadRequestException {
  constructor() {
    super('Provedor não foi encontrado');
  }
}
