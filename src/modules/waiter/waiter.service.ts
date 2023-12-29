/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Waiter } from '@prisma/client';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { PrismaService } from '~/infra/prisma/prisma.service';

import { UnauthorizedException } from '../auth/errors/UnauthorizedException';
import { RestaurantManagerNotFoundException } from '../restaurant/errors/restaurant-manager-not-found-exception';
import { WaiterNotFoundException } from './errors/WaiterNotFoundException';

type CreateWaiter = {
  username: string;
  password: string;
  name: string;
  restaurantManagerId: string;
};

@Injectable()
export class WaiterService {
  constructor(
    private prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
  ) { }

  async getByUsername(username: string): Promise<Waiter | null> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        username,
      },
    });

    if (!waiter) return null;

    return waiter;
  }

  async getById(id: string): Promise<Waiter | null> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id,
      },
    });

    if (!waiter) return null;

    return waiter;
  }

  async listByRestaurantManagerId(restaurantManagerId: string, page: number) {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const [waiters, matchCount] = await Promise.all([
      this.prisma.waiter.findMany({
        where: {
          restaurantId: restaurantManager.restaurantId,
        },
        take: 10,
        skip: (page - 1) * 10,
      }),
      this.prisma.waiter.count({
        where: {
          restaurantId: restaurantManager.restaurantId,
        },
      }),
    ]);

    const numberOfPages = Math.ceil(matchCount / 10);

    return {
      waiters,
      matchCount,
      numberOfPages,
    };
  }

  async create({
    username,
    name,
    password,
    restaurantManagerId,
  }: CreateWaiter) {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (this.isOnlyWhitespaceOrEmpty(username)) {
      throw new BadRequestException('Email vazio');
    }

    const emailAlreadyUsed = await this.prisma.waiter.findFirst({
      where: { username },
    });

    if (emailAlreadyUsed) {
      throw new BadRequestException('Email já utilizado');
    }

    const waiter = await this.prisma.waiter.create({
      data: {
        onesignal_id: '',
        username,
        name,
        password: await this.passwordEncryption.encrypt(password),
        restaurantId: restaurantManager.restaurantId,
      },
    });

    return waiter;
  }

  isOnlyWhitespaceOrEmpty(str: string): boolean {
    return !str || str.trim().length === 0;
  }

  async update(waiterId: string, body: any): Promise<any> {

    const restaurantManagerId = body.restaurantManagerId;
    const name = body.name;
    const username = body.username;
    const password = body.password;

    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    if (restaurantManager.restaurantId !== waiter.restaurantId) {
      throw new UnauthorizedException();
    }

    if (!password) {
      return this.prisma.waiter.update({
        where: {
          id: waiterId,
        },
        data: {
          name,
          username,
        },
      });
    }

    return this.prisma.waiter.update({
      where: {
        id: waiterId,
      },
      data: {
        name,
        username,
        password: password && (await this.passwordEncryption.encrypt(password)),
      },
    });
  }

  async uptSenha(waiterId: string, body: any): Promise<any> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    return this.prisma.waiter.update({
      where: {
        id: waiterId,
      },
      data: {
        password: await this.passwordEncryption.encrypt(body.password),
      },
    });
  }


  async addOnesignal(waiterId: string, body: any): Promise<any> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    return this.prisma.waiter.update({
      where: {
        id: waiterId,
      },
      data: {
        onesignal_id: body.onesignal_id,
      },
    });
  }

  async delete(waiterId: string, body: any): Promise<void> {
    const restaurantManagerId = body.restaurantManagerId;

    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    if (restaurantManager.restaurantId !== waiter.restaurantId) {
      throw new UnauthorizedException();
    }

    await this.prisma.waiter.delete({
      where: {
        id: waiterId,
      },
    });
  }

}
