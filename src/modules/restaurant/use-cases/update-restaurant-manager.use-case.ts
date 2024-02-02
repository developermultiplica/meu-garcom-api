import { BadRequestException, Injectable } from '@nestjs/common';
import { RestaurantManager } from '@prisma/client';
import { isPast } from 'date-fns';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { PrismaService } from '~/infra/prisma/prisma.service';

import { RestaurantManagerUseCase } from '../abstractions/restaurant-manager-use-case';
import { InactiveRestaurantException } from '../errors/inactive-restaurant-exception';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  requesterRestaurantManagerId: string;
  targetRestaurantManagerId: string;
  name?: string;
  password?: string;
};

@Injectable()
export class UpdateRestaurantManager extends RestaurantManagerUseCase<Request> {
  constructor(
    private readonly prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
  ) {
    super();
  }

  async handle({
    requesterRestaurantManagerId,
    targetRestaurantManagerId,
    name,
    password,
  }: Request): Promise<RestaurantManager> {
    const requesterRestaurantManager =
      await this.prisma.restaurantManager.findUnique({
        where: { id: requesterRestaurantManagerId },
      });

    if (!requesterRestaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (!requesterRestaurantManager.isOwner) {
      throw new BadRequestException(
        'Apenas o usuário dono do estabelecimento pode editar colaboradores',
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

    return this.prisma.restaurantManager.update({
      where: {
        id: targetRestaurantManagerId,
      },
      data: {
        name,
        password: password && (await this.passwordEncryption.encrypt(password)),
      },
    });
  }
}
