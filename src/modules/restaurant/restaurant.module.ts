/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';
import { StorageModule } from '~/infra/storage/storage.module';

import { ProviderService } from '../provider/provider.service';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import { RestaurantManagerController } from './controllers/restaurant-manager.controller';
import { RestaurantController } from './controllers/restaurant.controller';
import { CategoryService } from './services/category.service';
import { RestaurantService } from './services/restaurant.service';
import { ChangeRestaurantExpirationById } from './use-cases/change-restaurant-expiration-by-id.use-case';
import { CreateProduct } from './use-cases/create-product.use-case';
import { CreateRestaurantManager } from './use-cases/create-restaurant-manager.use-case';
import { DeleteProduct } from './use-cases/delete-product.use-case';
import { DeleteRestaurantManager } from './use-cases/delete-restaurant-manager.use-case';
import { GetProductsByRestaurantId } from './use-cases/get-products-by-restaurant-id.use-case';
import { ListProductsByRestaurantManagerId } from './use-cases/list-products-by-restaurant-manager-id.use-case';
import { ListRestaurantsByProviderId } from './use-cases/list-restaurants-by-provider-id.use-case';
import { UpdateProduct } from './use-cases/update-product.use-case';
import { UpdateRestaurantById } from './use-cases/update-restaurant-by-id.use-case';
import { UpdateRestaurantByProvider } from './use-cases/update-restaurant-by-provider.use-case';
import { UpdateRestaurantManagerProvider } from './use-cases/update-restaurant-manager-provider.use-case';
import { UpdateRestaurantManager } from './use-cases/update-restaurant-manager.use-case';

@Module({
  imports: [PrismaModule, EncryptionModule, StorageModule],
  controllers: [
    RestaurantController,
    CategoryController,
    ProductController,
    RestaurantManagerController,
  ],
  providers: [
    RestaurantService,
    ProviderService,
    CategoryService,
    GetProductsByRestaurantId,
    ListProductsByRestaurantManagerId,
    UpdateRestaurantById,
    UpdateRestaurantByProvider,
    CreateProduct,
    DeleteProduct,
    UpdateProduct,
    ChangeRestaurantExpirationById,
    ListRestaurantsByProviderId,
    CreateRestaurantManager,
    UpdateRestaurantManager,
    UpdateRestaurantManagerProvider,
    DeleteRestaurantManager,
  ],
  exports: [RestaurantService],
})
export class RestaurantModule {}
