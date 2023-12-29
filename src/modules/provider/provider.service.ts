import { BadRequestException, Injectable } from '@nestjs/common';
import { Provider, ProviderManager } from '@prisma/client';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { PrismaService } from '~/infra/prisma/prisma.service';

import { RestaurantNotFoundException } from '../restaurant/errors/restaurant-not-fount-exception';
import { CreateProviderDto } from './dtos/create-provider.dto';
import { ProviderNotFoundException } from './errors/provider-not-fount-exception';

type DoesRestaurantBelongToProviderParams = {
  providerId: string;
  restaurantId: string;
};

@Injectable()
export class ProviderService {
  constructor(
    private prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
  ) {}

  async getManagerByUsername(
    username: string,
  ): Promise<ProviderManager | null> {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        username,
      },
    });

    if (!providerManager) return null;

    return providerManager;
  }

  async getManagerById(id: string): Promise<ProviderManager | null> {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        id,
      },
    });

    if (!providerManager) return null;

    return providerManager;
  }

  async getById(id: string): Promise<Provider | null> {
    const provider = await this.prisma.provider.findUnique({
      where: {
        id,
      },
    });

    if (!provider) return null;

    return provider;
  }

  async create({
    providerName,
    managerName,
    username,
    password,
  }: CreateProviderDto) {
    const emailAlreadyUsed = await this.prisma.providerManager.findUnique({
      where: { username },
    });

    if (emailAlreadyUsed) {
      throw new BadRequestException('Email já utilizado');
    }

    const provider = await this.prisma.provider.create({
      data: {
        name: providerName,
        managers: {
          create: {
            name: managerName,
            username,
            password: await this.passwordEncryption.encrypt(password),
          },
        },
      },
    });

    return provider;
  }

  async doesRestaurantBelongToProvider({
    restaurantId,
    providerId,
  }: DoesRestaurantBelongToProviderParams) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new ProviderNotFoundException();
    }

    return restaurant.providerId === provider.id;
  }
}
