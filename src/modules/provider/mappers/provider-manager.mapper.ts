import { ProviderManager as PrismaProviderManager } from '@prisma/client';

import { ProviderManager } from '../entities/provider-manager.entity';

export abstract class ProviderManagerMapper {
  static toHTTP(providerManager: PrismaProviderManager): ProviderManager {
    return {
      id: providerManager.id,
      name: providerManager.name,
      username: providerManager.username,
      providerId: providerManager.providerId,
      createdAt: providerManager.createdAt,
    };
  }
}
