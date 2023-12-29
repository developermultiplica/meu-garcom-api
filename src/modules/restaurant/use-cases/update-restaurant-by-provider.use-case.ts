/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { BucketPaths } from '~/infra/storage/enums/bucket-paths';
import { S3Service } from '~/infra/storage/s3.service';

import { RestaurantUseCase } from '../abstractions/restaurant-use-case';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  restaurantId: string;
  name?: string;
  maxTables?: number;
  banner?: Express.Multer.File;
};

@Injectable()
export class UpdateRestaurantByProvider extends RestaurantUseCase<Request> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async handle({ restaurantId, banner, name, maxTables }: Request): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    let bannerUrl = restaurant.bannerUrl;

    if (banner) {
      const { bannerUrl: newBannerUrl } = await this.updateBanner({
        banner,
        restaurant,
      });

      bannerUrl = newBannerUrl;
    }

    return this.prisma.restaurant.update({
      where: {
        id: restaurant.id,
      },
      data: {
        name,
        maxTables,
        bannerUrl,
      },
    });
  }

  private async updateBanner({
    restaurant,
    banner,
  }: UpdateBannerParams): Promise<{
    bannerUrl: string;
  }> {
    const uploadNewBanner = async () => {
      const { url: bannerUrl } = await this.s3Service.uploadFile({
        bucketPath: BucketPaths.RESTAURANT_BANNER,
        file: banner,
      });

      return { bannerUrl };
    };

    if (restaurant.bannerUrl === null) {
      return uploadNewBanner();
    }

    const currentBannerKey = new URLSearchParams(restaurant.bannerUrl).get(
      'key',
    );

    if (!currentBannerKey) {
      return uploadNewBanner();
    }

    await this.s3Service.uploadFile({
      file: banner,
      bucketPath: BucketPaths.RESTAURANT_BANNER
    });

    return { bannerUrl: restaurant.bannerUrl };
  }
}

type UpdateBannerParams = {
  restaurant: Restaurant;
  banner: Express.Multer.File;
};
