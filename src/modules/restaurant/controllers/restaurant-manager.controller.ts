/* eslint-disable prettier/prettier */
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

import { CreateRestaurantManagerDto } from '../dtos/create-restaurant-manager.dto';
import { DeleteRestaurantManagerDto } from '../dtos/delete-restaurant-manager.dto';
import { RestaurantIdDto } from '../dtos/restaurant-id.dto';
import { UpdateRestaurantManagerProviderDto } from '../dtos/update-restaurant-manager-provider.dto';
import { UpdateRestaurantManagerDto } from '../dtos/update-restaurant-manager.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { RestaurantManagerMapper } from '../mappers/restaurant-manager.mapper';
import { CategoryService } from '../services/category.service';
import { RestaurantService } from '../services/restaurant.service';
import { CreateRestaurantManager } from '../use-cases/create-restaurant-manager.use-case';
import { DeleteRestaurantManager } from '../use-cases/delete-restaurant-manager.use-case';
import { UpdateRestaurantManagerProvider } from '../use-cases/update-restaurant-manager-provider.use-case';
import { UpdateRestaurantManager } from '../use-cases/update-restaurant-manager.use-case';
import { CategoriesView } from '../views/categories.view';
import { PaginatedRestaurantManagersView } from '../views/paginated-restaurant-managers.view';
import { RestaurantManagerView } from '../views/restaurant-manager.view';

@ApiBearerAuth()
@ApiTags('restaurant-manager')
@Controller('restaurant-manager')
export class RestaurantManagerController {
  constructor(
    private restaurantService: RestaurantService,
    private categoryService: CategoryService,
    private createRestaurantManager: CreateRestaurantManager,
    private updateRestaurantManager: UpdateRestaurantManager,
    private updateManagerProvider: UpdateRestaurantManagerProvider,
    private deleteRestaurantManager: DeleteRestaurantManager,
  ) { }

  @Get('all')
  async getManagers() {
    return this.restaurantService.getManagers();
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem paginada de gerentes do restaurante a partir do dono do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get()
  async list(
    @Query() { page }: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedRestaurantManagersView> {
    const { restaurantManagers, matchCount, numberOfPages } =
      await this.restaurantService.listManagersByRestaurantManagerId({
        requesterRestaurantManagerId: req.user.id,
        page,
      });

    return {
      restaurantManagers: restaurantManagers.map(
        RestaurantManagerMapper.toHTTP,
      ),
      matchCount,
      numberOfPages,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem de todas as categorias do restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get('/categories/:restaurantId')
  async getCategorieByRestaurantIdManager(
    @Param() { restaurantId }: RestaurantIdDto,
  ): Promise<CategoriesView> {
    const categories = await this.categoryService.getByRestaurantId(
      restaurantId,
    );

    return { categories: categories.map(CategoryMapper.toHTTP) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem de todos os garçons do restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get('/waiters/:restaurantId')
  async getWaiterByRestaurantIdManager(
    @Param() { restaurantId }: RestaurantIdDto,
  ): Promise<any> {
    const waiters = await this.restaurantService.getWaiterByRestaurantId(
      restaurantId,
    );

    return waiters;
  }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de um gerente do restaurante a partir do dono do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateRestaurantManagerDto,
  ): Promise<RestaurantManagerView> {
    const restaurantManager = await this.createRestaurantManager.handle({
      ...body,
      requesterRestaurantManagerId: req.user.id,
    });

    return {
      restaurantManager: RestaurantManagerMapper.toHTTP(restaurantManager),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para atualização de um gerente de restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Put('/:restaurantManagerId')
  async update(
    @Req() req: Request,
    @Param() { restaurantManagerId }: DeleteRestaurantManagerDto,
    @Body() body: UpdateRestaurantManagerDto,
  ): Promise<RestaurantManagerView> {
    const restaurantManager = await this.updateRestaurantManager.handle({
      targetRestaurantManagerId: restaurantManagerId,
      requesterRestaurantManagerId: req.user.id,
      ...body,
    });

    return {
      restaurantManager: RestaurantManagerMapper.toHTTP(restaurantManager),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada por um provider para atualização de um gerente de restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @Put('/:restaurantManagerId/provider')
  async updateProvider(
    @Req() req: Request,
    @Param() { restaurantManagerId }: DeleteRestaurantManagerDto,
    @Body() body: UpdateRestaurantManagerProviderDto,
  ): Promise<RestaurantManagerView> {
    const restaurantManager = await this.updateManagerProvider.handle({
      targetRestaurantManagerId: restaurantManagerId,
      requesterRestaurantManagerId: restaurantManagerId,
      ...body,
    });

    return {
      restaurantManager: RestaurantManagerMapper.toHTTP(restaurantManager),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para exclusão de um gerente de restaurante a partir do id informado no parâmetro',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Delete('/:restaurantManagerId')
  async delete(
    @Req() req: Request,
    @Param() { restaurantManagerId }: DeleteRestaurantManagerDto,
  ) {
    await this.deleteRestaurantManager.handle({
      targetRestaurantManagerId: restaurantManagerId,
      requesterRestaurantManagerId: req.user.id,
    });
  }
}
