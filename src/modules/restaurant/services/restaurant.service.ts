/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { RestaurantManager } from '@prisma/client';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { PrismaService } from '~/infra/prisma/prisma.service';
import { BucketPaths } from '~/infra/storage/enums/bucket-paths';
import { S3Service } from '~/infra/storage/s3.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';

import { CreateRestaurantDto } from '../dtos/create-restaurant.dto';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type GetManagersByRestaurantManagerId = {
  requesterRestaurantManagerId: string;
  page: number;
};

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
    private readonly s3Service: S3Service
  ) { }

  async getAll() {
    const restaurant = await this.prisma.restaurant.findMany();
    return restaurant;
  }

  async getManagers() {
    const restaurant = await this.prisma.restaurantManager.findMany();
    return restaurant;
  }

  async upT(customerId: number, updateData: any) {
    return this.prisma.restaurant.update({
      where: { id: customerId.toString() },
      data: updateData,
    });
  }

  //others

  async getManagerByUsername(username: string) {
    const manager = await this.prisma.restaurantManager.findUnique({
      where: {
        username,
      },
      include: {
        restaurant: true,
      },
    });

    if (!manager) return null;

    return manager;
  }

  async getManagerById(id: string): Promise<RestaurantManager | null> {
    const manager = await this.prisma.restaurantManager.findUnique({
      where: {
        id,
      },
    });

    if (!manager) return null;
    console.log('Manager ===> ' + JSON.stringify(manager));

    return manager;
  }

  async createRestaurant({
    providerManagerId,
    banner,
    username,
    managerName,
    restaurantName,
    password,
    expiresAt,
    maxTables,
  }: CreateRestaurantDto & { providerManagerId: string, banner: Express.Multer.File }) {

    this.prisma.restaurant;

    const providerManager = await this.prisma.providerManager.findUnique({
      where: { id: providerManagerId },
    });

    if (!providerManager) {
      throw new BadRequestException('Gerente não encontrado');
    }

    const emailAlreadyUsed = await this.prisma.restaurantManager.findFirst({
      where: { username },
    });

    if (emailAlreadyUsed) {
      throw new BadRequestException('Email já utilizado');
    }

    //Verificar agora se tem o banner
    let imageUrl: any | null = null;

    if (banner) {
      const { url } = await this.s3Service.uploadFile({
        bucketPath: BucketPaths.RESTAURANT_BANNER,
        file: banner,
      });

      imageUrl = url;
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        providerId: providerManager.providerId,
        name: restaurantName,
        expiresAt,
        maxTables,
        bannerUrl: imageUrl,
        managers: {
          create: {
            name: managerName,
            username,
            isOwner: true,
            password: await this.passwordEncryption.encrypt(password),
          },
        },
      },
      include: {
        managers: true,
      },
    });

    return restaurant;
  }

  async listManagersByRestaurantManagerId({
    requesterRestaurantManagerId,
    page,
  }: GetManagersByRestaurantManagerId) {
    const requesterRestaurantManager =
      await this.prisma.restaurantManager.findUnique({
        where: {
          id: requesterRestaurantManagerId,
        },
      });

    if (!requesterRestaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (!requesterRestaurantManager.isOwner) {
      throw new UnauthorizedException();
    }

    const [restaurantManagers, matchCount] = await Promise.all([
      this.prisma.restaurantManager.findMany({
        where: {
          restaurantId: requesterRestaurantManager.restaurantId,
        },
        take: 10,
        skip: (page - 1) * 10,
      }),
      this.prisma.restaurantManager.count({
        where: {
          restaurantId: requesterRestaurantManager.restaurantId,
        },
      }),
    ]);

    const numberOfPages = Math.ceil(matchCount / 10);

    return {
      restaurantManagers,
      matchCount,
      numberOfPages,
    };
  }

  //WAITERS
  async getWaiterByRestaurantId(restaurantId: string) {
    const waiter = await this.prisma.waiter.findMany({
      where: {
        restaurantId,
      },
    });

    if (!waiter) return null;

    return waiter;
  }

  async deleteRestaurant(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    // Encontre o RestaurantManager
    const manager = await this.prisma.restaurantManager.findFirst({
      where: { restaurantId },
    });

    if (!manager) {
      throw new RestaurantManagerNotFoundException();
    }

    // Encontre todos os objetos relacionados com o mesmo restaurantId
    const relatedCategories = await this.prisma.category.findMany({
      where: { restaurantId },
    });

    const relatedProducts = await this.prisma.product.findMany({
      where: { restaurantId },
    });

    const relatedTables = await this.prisma.table.findMany({
      where: { restaurantId },
    });

    const relatedWaiters = await this.prisma.waiter.findMany({
      where: { restaurantId },
    });

    // Exclua todos os objetos relacionados
    for (const category of relatedCategories) {
      await this.prisma.category.delete({
        where: { id: category.id },
      });
    }

    for (const product of relatedProducts) {
      await this.prisma.product.delete({
        where: { id: product.id },
      });
    }

    for (const table of relatedTables) {
      await this.prisma.table.delete({
        where: { id: table.id },
      });
    }

    for (const waiter of relatedWaiters) {
      await this.prisma.waiter.delete({
        where: { id: waiter.id },
      });
    }

    // Exclua o RestaurantManager e o Restaurant
    await this.prisma.restaurantManager.delete({
      where: { id: manager.id },
    });

    await this.prisma.restaurant.delete({
      where: { id: restaurantId },
    });
  }

}