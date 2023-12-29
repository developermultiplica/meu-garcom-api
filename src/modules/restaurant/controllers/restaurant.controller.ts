/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { PaginationQueryDto } from '~/helpers/dtos/pagination-query.dto';
import { ROLE } from '~/modules/auth/constants/role';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';
import { ProviderManagerNotFoundException } from '~/modules/provider/errors/provider-manager-not-fount-exception';
import { ProviderService } from '~/modules/provider/provider.service';

import { ChangeRestaurantExpirationDto } from '../dtos/change-restaurant-expiration.dto';
import { CreateRestaurantDto } from '../dtos/create-restaurant.dto';
import { RestaurantIdDto } from '../dtos/restaurant-id.dto';
import { UpdateRestaurantByIdDto } from '../dtos/update-restaurant-by-id.dto';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantMapper } from '../mappers/restaurant.mapper';
import { RestaurantService } from '../services/restaurant.service';
import { ChangeRestaurantExpirationById } from '../use-cases/change-restaurant-expiration-by-id.use-case';
import { ListRestaurantsByProviderId } from '../use-cases/list-restaurants-by-provider-id.use-case';
import { UpdateRestaurantById } from '../use-cases/update-restaurant-by-id.use-case';
import { UpdateRestaurantByProvider } from '../use-cases/update-restaurant-by-provider.use-case';
import { PaginatedRestaurantsView } from '../views/paginated-restaurants.view';
import { RestaurantView } from '../views/restaurant.view';
@ApiBearerAuth()
@ApiTags('restaurant')
@Controller('restaurant')
export class RestaurantController {
  constructor(
    private providerService: ProviderService,
    private restaurantService: RestaurantService,
    private updateRestaurantById: UpdateRestaurantById,
    private updateRestaurantByProvider: UpdateRestaurantByProvider,
    private changeRestaurantExpirationById: ChangeRestaurantExpirationById,
    private getRestaurantsByProviderId: ListRestaurantsByProviderId,
  ) { }

  @Get('all')
  async getAll() {
    return this.restaurantService.getAll();
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id') customerId: number,
    @Body() updateCustomerDto: any,
  ) {
    return this.restaurantService.upT(customerId, updateCustomerDto);
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem paginada de restaurantes de um provedor a partir do provedor logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @Get(':value')
  async getByProviderId(
    @Req() req: Request,
    @Param('value') value: string,
    @Query() { page }: PaginationQueryDto,
  ): Promise<PaginatedRestaurantsView> {
    const { restaurants, matchCount, numberOfPages } =
      await this.getRestaurantsByProviderId.handle({
        providerManagerId: req.user.id,
        value,
        page,
      });

    return {
      restaurants: restaurants.map(RestaurantMapper.toHTTP),
      matchCount,
      numberOfPages,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de um restaurante a partir do provedor logado',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @UseInterceptors(FileInterceptor('banner'))
  @Post()
  async create(
    @UploadedFile() banner: Express.Multer.File,
    @Req() req: Request,
    @Body() body: CreateRestaurantDto,
  ) {
    await this.restaurantService.createRestaurant({
      ...body,
      maxTables: Number(body.maxTables),
      providerManagerId: req.user.id,
      banner
    });
  }

  @ApiOperation({
    summary: 'Rota utilizada para um provider atualizar um restaurante',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @UseInterceptors(FileInterceptor('banner'))
  @Put(':restaurantId')
  async updateByRestaurantManagerId(
    @UploadedFile() banner: Express.Multer.File,
    @Req() req: Request,
    @Param() { restaurantId }: RestaurantIdDto,
    @Body() body: UpdateRestaurantByIdDto,
  ): Promise<RestaurantView> {
    const providerManager = await this.providerService.getManagerById(
      req.user.id,
    );

    if (!providerManager) {
      throw new ProviderManagerNotFoundException();
    }

    const restaurantDoesNotBelongToProvider =
      !(await this.providerService.doesRestaurantBelongToProvider({
        providerId: providerManager.providerId,
        restaurantId,
      }));

    if (restaurantDoesNotBelongToProvider) {
      throw new UnauthorizedException();
    }

    const restaurant = await this.updateRestaurantByProvider.handle({
      restaurantId,
      banner,
      name: body.name,
      maxTables: Number(body.maxTables),
    });

    return { restaurant: RestaurantMapper.toHTTP(restaurant) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para atualização de um restaurante a partir do gerente do restaurante logado',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @UseInterceptors(FileInterceptor('banner'))
  @Put()
  async update(
    @UploadedFile() banner: Express.Multer.File,
    @Req() req: Request,
    @Body() body: UpdateRestaurantByIdDto,
  ): Promise<RestaurantView> {
    const restaurantManager = await this.restaurantService.getManagerById(
      req.user.id,
    );

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const restaurant = await this.updateRestaurantById.handle({
      restaurantId: restaurantManager.restaurantId,
      banner,
      name: body.name,
      maxTables: Number(body.maxTables),
    });

    return { restaurant: RestaurantMapper.toHTTP(restaurant) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para atualização da expiração de um restaurante a partir do id informado no parâmetro',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @Patch(':restaurantId/expiration')
  async changeExpiration(
    @Req() req: Request,
    @Param() { restaurantId }: RestaurantIdDto,
    @Body() { expiresAt }: ChangeRestaurantExpirationDto,
  ) {
    await this.changeRestaurantExpirationById.handle({
      providerManagerId: req.user.id,
      restaurantId,
      expiresAt,
    });
  }

  @ApiOperation({
    summary:
      'Rota utilizada por um provider para deletar um restaurante a partir do id informado no parâmetro',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @Delete(':restaurantId')
  async deleteRestaurant(
    @Param() { restaurantId }: RestaurantIdDto
  ) {
    await this.restaurantService.deleteRestaurant(restaurantId);
  }
}
