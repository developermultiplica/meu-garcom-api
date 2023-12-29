/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';

import { RestaurantUseCase } from '../abstractions/restaurant-use-case';

type Request = {
  providerManagerId: string;
  value: string;
  page: number;
};

type Response = {
  restaurants: Restaurant[];
  matchCount: number;
  numberOfPages: number;
};

@Injectable()
export class ListRestaurantsByProviderId extends RestaurantUseCase<
  Request,
  Response
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async handle({ providerManagerId, value, page }: Request): Promise<Response> {
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

    const currentDateTime = new Date();

    let restaurants;
    let matchCount;

    if (value === 'true') {
      // Restaurantes Ativos
      [restaurants, matchCount] = await Promise.all([
        this.prisma.restaurant.findMany({
          where: {
            providerId: provider.id,
            expiresAt: {
              gte: currentDateTime,
            },
          },
          take: 10,
          skip: (page - 1) * 10,
        }),
        this.prisma.restaurant.count({
          where: {
            providerId: provider.id,
            expiresAt: {
              gte: currentDateTime,
            },
          },
        }),
      ]);
    } else {
      // Restaurantes Inativos
      [restaurants, matchCount] = await Promise.all([
        this.prisma.restaurant.findMany({
          where: {
            providerId: provider.id,
            expiresAt: {
              lt: currentDateTime,
            },
          },
          take: 10,
          skip: (page - 1) * 10,
        }),
        this.prisma.restaurant.count({
          where: {
            providerId: provider.id,
            expiresAt: {
              lt: currentDateTime,
            },
          },
        }),
      ]);
    }

    const numberOfPages = Math.ceil(matchCount / 10);

    return {
      restaurants,
      matchCount,
      numberOfPages,
    };
  }
}
