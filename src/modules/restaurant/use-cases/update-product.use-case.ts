/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ProductAvailabilityType } from '@prisma/client';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { BucketPaths } from '~/infra/storage/enums/bucket-paths';
import { S3Service } from '~/infra/storage/s3.service';

import {
  ProductUseCase,
  ProductWithIncludes,
} from '../abstractions/product-use-case';
import { CategoryNotFoundException } from '../errors/category-not-found-exception';
import { InactiveRestaurantException } from '../errors/inactive-restaurant-exception';
import { ProductNotFoundException } from '../errors/product-not-found-exception';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  restaurantManagerId: string;
  productId: string;
  categoryId?: string;
  name?: string;
  description?: string;
  priceInCents?: number;
  estimatedMinutesToPrepare?: number | null;
  availabilityType?: ProductAvailabilityType;
  availableAmount?: number;
  isAvailable?: boolean;
  image?: Express.Multer.File | null;
};

@Injectable()
export class UpdateProduct extends ProductUseCase<Request> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async handle({
    restaurantManagerId,
    productId,
    categoryId,
    name,
    description,
    priceInCents,
    estimatedMinutesToPrepare,
    availabilityType,
    availableAmount,
    isAvailable,
    image,
  }: Request): Promise<ProductWithIncludes> {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
      include: {
        restaurant: true,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const restaurant = restaurantManager.restaurant;

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    if (isPast(restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new ProductNotFoundException();
    }

    if (!!categoryId) {
      const category = await this.prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    if (availabilityType === 'AVAILABILITY') {
      availableAmount = 1;
    }

    let imageUrl = product.imageUrl;

    if (!!image) {
      const { url } = await this.s3Service.uploadFile({
        bucketPath: BucketPaths.PRODUCT_PHOTO,
        file: image,
      });

      imageUrl = url;
    }

    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        description,
        priceInCents,
        categoryId,
        restaurantId: restaurant.id,
        availabilityType,
        isAvailable,
        availableAmount,
        estimatedMinutesToPrepare,
        imageUrl,
      },
      include: this.productInclude,
    });
  }
}
