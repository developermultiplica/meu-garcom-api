import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';

import { RestaurantUseCase } from '../abstractions/restaurant-use-case';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  providerManagerId: string;
  restaurantId: string;
  expiresAt: string;
};

@Injectable()
export class ChangeRestaurantExpirationById extends RestaurantUseCase<
  Request,
  void
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async handle({
    providerManagerId,
    restaurantId,
    expiresAt,
  }: Request): Promise<void> {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        id: providerManagerId,
      },
      include: {
        provider: true,
      },
    });

    if (!providerManager) {
      throw new BadRequestException('Gerente não encontrado');
    }

    const { provider } = providerManager;

    if (!provider) {
      throw new BadRequestException('Provedor não encontrado');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    if (restaurant.providerId !== provider.id) {
      throw new UnauthorizedException();
    }

    await this.prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        expiresAt,
      },
    });
  }
}
