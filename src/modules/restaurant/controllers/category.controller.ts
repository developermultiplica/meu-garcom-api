import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { PaginationQueryDto } from '~/helpers/dtos/pagination-query.dto';
import { ROLE } from '~/modules/auth/constants/role';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';

import { CategoryIdDto } from '../dtos/category-id.dto';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { RestaurantIdDto } from '../dtos/restaurant-id.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from '../services/category.service';
import { CategoriesView } from '../views/categories.view';
import { CategoryView } from '../views/category.view';
import { PaginatedCategoriesView } from '../views/paginated-categories.view';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @ApiOperation({
    summary:
      'Rota utilizada para criação de uma categoria do restaurante a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Post()
  async create(
    @Req() req: Request,
    @Body() { name }: CreateCategoryDto,
  ): Promise<CategoryView> {
    const category = await this.categoryService.create({
      name,
      restaurantManagerId: req.user.id,
    });

    return { category: CategoryMapper.toHTTP(category) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem de todas as categorias do restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Get('/restaurant/:restaurantId')
  async getByRestaurantId(
    @Param() { restaurantId }: RestaurantIdDto,
  ): Promise<CategoriesView> {
    const categories = await this.categoryService.getByRestaurantId(
      restaurantId,
    );

    return { categories: categories.map(CategoryMapper.toHTTP) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem paginada de categorias a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get()
  async list(
    @Query() { page }: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedCategoriesView> {
    const { categories, matchCount, numberOfPages } =
      await this.categoryService.listByRestaurantManagerId(req.user.id, page);

    return {
      categories: categories.map(CategoryMapper.toHTTP),
      matchCount,
      numberOfPages,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para atualização de uma categoria a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Put(':categoryId')
  async update(
    @Req() req: Request,
    @Param() { categoryId }: CategoryIdDto,
    @Body() { name }: UpdateCategoryDto,
  ): Promise<CategoryView> {
    const category = await this.categoryService.updateById({
      id: categoryId,
      name,
      restaurantManagerId: req.user.id,
    });

    return { category: CategoryMapper.toHTTP(category) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para exclusão de uma categoria a partir do id informado no parâmetro',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Delete(':categoryId')
  async delete(
    @Req() req: Request,
    @Param() { categoryId }: CategoryIdDto,
  ): Promise<void> {
    await this.categoryService.delete({
      id: categoryId,
      restaurantManagerId: req.user.id,
    });
  }
}
