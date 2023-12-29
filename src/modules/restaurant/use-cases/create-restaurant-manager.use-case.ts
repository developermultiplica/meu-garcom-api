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
  name: string;
  username: string;
  password: string;
};

@Injectable()
export class CreateRestaurantManager extends RestaurantManagerUseCase<Request> {
  constructor(
    private readonly prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
  ) {
    super();
  }

  async handle({
    requesterRestaurantManagerId,
    name,
    username,
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
        'Apenas o usuário dono do estabelecimento pode registrar novos colaboradores',
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

    const usernameAlreadyUsed = await this.prisma.restaurantManager.findUnique({
      where: { username },
    });

    if (usernameAlreadyUsed) {
      throw new BadRequestException('Já existe um colaborador com esse e-mail');
    }

    return this.prisma.restaurantManager.create({
      data: {
        name,
        username,
        password: await this.passwordEncryption.encrypt(password),
        restaurantId: requesterRestaurantManager.restaurantId,
        isOwner: false,
      },
    });
  }
}
