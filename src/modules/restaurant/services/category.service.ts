/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { isPast } from 'date-fns';

import { TypedOmit } from '~/helpers/types/typed-omit';
import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';

import { CategoryCharacterException } from '../errors/category-character-exception';
import { CategoryNotFoundException } from '../errors/category-not-found-exception';
import { InactiveRestaurantException } from '../errors/inactive-restaurant-exception';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type CreateCategory = {
  name: string;
  restaurantManagerId: string;
};

type UpdateCategoryById = TypedOmit<Category, 'restaurantId'> & {
  restaurantManagerId: string;
};

type DeleteCategoryById = Pick<Category, 'id'> & {
  restaurantManagerId: string;
};

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private async validateRestaurantIsActiveByRestaurantManagerId(
    restaurantManagerId: string,
  ) {
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

    return {
      restaurantId: restaurant.id,
    };
  }

  private async verifyRestaurantCategoryAlreadyExists({
    name,
    restaurantId,
  }: {
    name: string;
    restaurantId: string;
  }) {
    const categoryAlreadyExists = await this.prisma.category.findUnique({
      where: {
        restaurantId_name: {
          name,
          restaurantId,
        },
      },
    });

    if (categoryAlreadyExists) {
      throw new BadRequestException(`A categoria ${name} já existe`);
    }
  }

  private async verifyRestaurantIsCategoryOwner({
    categoryId,
    restaurantId,
  }: {
    categoryId: string;
    restaurantId: string;
  }) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.restaurantId !== restaurantId) {
      throw new UnauthorizedException();
    }
  }

  async create(data: CreateCategory) {

    if (data.name.length === 1) {
      throw new CategoryCharacterException();
    }

    const { restaurantId } =
      await this.validateRestaurantIsActiveByRestaurantManagerId(
        data.restaurantManagerId,
      );

    await this.verifyRestaurantCategoryAlreadyExists({
      name: data.name,
      restaurantId,
    });

    return this.prisma.category.create({
      data: {
        name: data.name,
        restaurantId,
      },
    });
  }

  async getByRestaurantId(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
    });
  }

  async getCategoryNamesByRestauranteId(restaurantId: string): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      where: { restaurantId },
    });
  
    const categoryNames = categories.map((category) => category.name);
    return categoryNames;
  }
   

  async listByRestaurantManagerId(restaurantManagerId: string, page: number) {
    const { restaurantId } =
      await this.validateRestaurantIsActiveByRestaurantManagerId(
        restaurantManagerId,
      );

    const [categories, matchCount] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          restaurantId,
        },
        take: 10,
        skip: (page - 1) * 10,
      }),
      this.prisma.category.count({
        where: {
          restaurantId,
        },
      }),
    ]);

    const numberOfPages = Math.ceil(matchCount / 10);

    return {
      categories,
      matchCount,
      numberOfPages,
    };
  }

  async updateById({ id, restaurantManagerId, ...data }: UpdateCategoryById) {
    const { restaurantId } =
      await this.validateRestaurantIsActiveByRestaurantManagerId(
        restaurantManagerId,
      );

    await this.verifyRestaurantIsCategoryOwner({
      categoryId: id,
      restaurantId,
    });

    // await this.verifyRestaurantCategoryAlreadyExists({
    //   name: data.name,
    //   restaurantId,
    // });

    return this.prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete({ id, restaurantManagerId }: DeleteCategoryById) {
    const { restaurantId } =
      await this.validateRestaurantIsActiveByRestaurantManagerId(
        restaurantManagerId,
      );

    await this.verifyRestaurantIsCategoryOwner({
      categoryId: id,
      restaurantId,
    });

    const categoryProducts = await this.prisma.product.findFirst({
      where: {
        categoryId: id,
      },
    });

    if (!!categoryProducts) {
      throw new BadRequestException(
        'Essa categoria possui produtos cadastrados',
      );
    }

    await this.prisma.category.delete({
      where: {
        id,
      },
    });
  }
}
