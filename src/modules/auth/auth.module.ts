import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimiterModule } from 'nestjs-rate-limiter';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { MailModule } from '~/infra/mail/mail.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';
import { SmsModule } from '~/infra/sms/sms.module';

import { CustomerModule } from '../customer/customer.module';
import { ProviderModule } from '../provider/provider.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { GetActiveTableSessionByCustomerId } from '../table/use-cases/get-active-table-session-by-customer-id.use-case';
import { WaiterModule } from '../waiter/waiter.module';
import { jwtSecret } from './constants/jwt-secret';
import { CustomerAuthController } from './controllers/auth-customer.controller';
import { ProviderManagerAuthController } from './controllers/auth-provider-manager.controller';
import { RestaurantManagerAuthController } from './controllers/auth-restaurant-manager.controller';
import { WaiterAuthController } from './controllers/auth-waiter.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthCustomerService } from './services/auth-customer.service';
import { AuthProviderService } from './services/auth-provider.service';
import { AuthRestaurantService } from './services/auth-restaurant.service';
import { AuthWaiterService } from './services/auth-waiter.service';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalCustomerStrategy } from './strategies/local-customer.strategy';
import { LocalProviderStrategy } from './strategies/local-provider.strategy';
import { LocalRestaurantStrategy } from './strategies/local-restaurant.strategy';
import { LocalWaiterStrategy } from './strategies/local-waiter.strategy';

@Module({
  imports: [
    CustomerModule,
    RateLimiterModule,
    RestaurantModule,
    ProviderModule,
    WaiterModule,
    PassportModule,
    EncryptionModule,
    PrismaModule,
    MailModule,
    SmsModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: '1h',
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AuthController,
    CustomerAuthController,
    RestaurantManagerAuthController,
    ProviderManagerAuthController,
    WaiterAuthController,
  ],
  providers: [
    JwtStrategy,
    LocalCustomerStrategy,
    AuthCustomerService,
    LocalRestaurantStrategy,
    AuthRestaurantService,
    LocalProviderStrategy,
    AuthProviderService,
    LocalWaiterStrategy,
    AuthWaiterService,
    AuthService,
    GetActiveTableSessionByCustomerId,
  ],
})
export class AuthModule {}
