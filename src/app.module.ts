/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { LoggingInterceptor } from './helpers/interceptors/logging.interceptor';
import { WebSocketModule } from './infra/web-socket/web-socket.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { TableModule } from './modules/table/table.module';
import { WaiterModule } from './modules/waiter/waiter.module';

@Module({
  imports: [
    NotificationModule,
    FilesModule,
    WebSocketModule,
    CustomerModule,
    RestaurantModule,
    AuthModule,
    TableModule,
    WaiterModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
