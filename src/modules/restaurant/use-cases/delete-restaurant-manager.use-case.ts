import { BadRequestException, Injectable } from '@nestjs/common';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';

import { RestaurantManagerUseCase } from '../abstractions/restaurant-manager-use-case';
import { InactiveRestaurantException } from '../errors/inactive-restaurant-exception';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  requesterRestaurantManagerId: string;
  targetRestaurantManagerId: string;
};

@Injectable()
export class DeleteRestaurantManager extends RestaurantManagerUseCase<
  Request,
  void
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async handle({
    requesterRestaurantManagerId,
    targetRestaurantManagerId,
  }: Request): Promise<void> {
    const requesterRestaurantManager =
      await this.prisma.restaurantManager.findUnique({
        where: { id: requesterRestaurantManagerId },
      });

    if (!requesterRestaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (!requesterRestaurantManager.isOwner) {
      throw new BadRequestException(
        'Apenas o usuário dono do estabelecimento pode remover colaboradores',
      );
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: requesterRestaurantManager.restaurantId },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    if (isPast(restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: { id: targetRestaurantManagerId },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (restaurantManager.isOwner) {
      throw new BadRequestException(
        'O usuário dono do estabelecimento não pode ser removido',
      );
    }

    await this.prisma.restaurantManager.delete({
      where: {
        id: targetRestaurantManagerId,
      },
    });
  }
}
