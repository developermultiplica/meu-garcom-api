/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RateLimiterModule } from 'nestjs-rate-limiter';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';
import { WebSocketModule } from '~/infra/web-socket/web-socket.module';

import { NotificationModule } from '../notification/notification.module';
import { CategoryService } from '../restaurant/services/category.service';
import { OrderProductController } from './controllers/order-product.controller';
import { TableSessionController } from './controllers/table-session.controller';
import { TableController } from './controllers/table.controller';
import { TableService } from './services/table.service';
import { CancelOrderProductWaiter } from './use-cases/cancel-order-product-waiter.use-case';
import { CancelOrderProduct } from './use-cases/cancel-order-product.use-case';
import { CreateTableSession } from './use-cases/create-table-session.use-case';
import { CreateTable } from './use-cases/create-table.use-case';
import { FinishTableSession } from './use-cases/finish-table-session.use-case';
import { GetActiveTableSessionByTableId } from './use-cases/get-active-table-session-by-table-id.use-case';
import { GetRestaurantTables } from './use-cases/get-restaurant-tables.use-case';
import { GetTableSessionById } from './use-cases/get-table-session-by-id.use-case';
import { GetWaiterTables } from './use-cases/get-waiter-tables.use-case';
import { JoinTableSession } from './use-cases/join-table-session.use-case';
import { RequestTableSessionOrder } from './use-cases/request-table-session-order.use-case';
import { RequestTableSessionPayment } from './use-cases/request-table-session-payment.use-case';
import { ServeOrderProductWaiter } from './use-cases/serve-order-product-waiter.use-case'; 
import { ServeOrderProduct } from './use-cases/serve-order-product.use-case';
import { SignTableToWaiter } from './use-cases/sign-table-to-waiter.use-case';

@Module({
  imports: [PrismaModule, EncryptionModule, WebSocketModule, RateLimiterModule, NotificationModule],
  controllers: [
    TableSessionController,
    TableController,
    OrderProductController,
  ],
  providers: [
    CreateTableSession,
    GetTableSessionById,
    GetActiveTableSessionByTableId,
    RequestTableSessionOrder,
    JoinTableSession,
    RequestTableSessionPayment,
    FinishTableSession,
    GetWaiterTables,
    GetRestaurantTables,
    CreateTable,
    SignTableToWaiter,
    CancelOrderProduct,
    CancelOrderProductWaiter,
    ServeOrderProduct,
    ServeOrderProductWaiter,
    CategoryService,
    TableService
  ],
})
export class TableModule {}
