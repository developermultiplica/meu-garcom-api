import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Session } from '@prisma/client';
import { isPast, subMonths } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';

import { SignIn } from '../views/sign-in.view';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async handleDeleteOldSessions() {
    this.logger.debug('Removing old sessions');
    const { count } = await this.prisma.session.deleteMany({
      where: {
        updatedAt: {
          lt: subMonths(new Date(), 2),
        },
      },
    });
    this.logger.debug(`${count} session(s) removed`);
  }

  async refreshToken(oldToken: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        token: oldToken,
      },
    });

    if (!session) throw new UnauthorizedException('Sessão não encontrada');

    switch (session.role) {
      case 'CUSTOMER':
        return this.createNewCustomerAccessToken(session);
      case 'PROVIDER_MANAGER':
        return this.createNewProviderManagerAccessToken(session);
      case 'RESTAURANT_MANAGER':
        return this.createNewRestaurantManagerAccessToken(session);
      case 'WAITER':
        return this.createNewWaiterAccessToken(session);
    }
  }

  private async createNewCustomerAccessToken(
    session: Session,
  ): Promise<SignIn> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!customer) throw new UnauthorizedException('Sessão inválida');

    const { accessToken } = await this.signIn({
      id: customer.id,
      role: 'customer',
      username: customer.username,
    });

    await this.prisma.session.update({
      where: {
        token: session.token,
      },
      data: {
        token: accessToken,
      },
    });

    return { accessToken };
  }

  private async createNewProviderManagerAccessToken(
    session: Session,
  ): Promise<SignIn> {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!providerManager) throw new UnauthorizedException('Sessão inválida');

    const { accessToken } = await this.signIn({
      id: providerManager.id,
      role: 'provider',
      username: providerManager.username,
    });

    await this.prisma.session.update({
      where: {
        token: session.token,
      },
      data: {
        token: accessToken,
      },
    });

    return { accessToken };
  }

  private async createNewRestaurantManagerAccessToken(
    session: Session,
  ): Promise<SignIn> {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        restaurant: true,
      },
    });

    if (!restaurantManager) throw new UnauthorizedException('Sessão inválida');

    if (isPast(restaurantManager.restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const { accessToken } = await this.signIn({
      id: restaurantManager.id,
      role: 'restaurant',
      username: restaurantManager.username,
    });

    await this.prisma.session.update({
      where: {
        token: session.token,
      },
      data: {
        token: accessToken,
      },
    });

    return { accessToken };
  }

  private async createNewWaiterAccessToken(session: Session): Promise<SignIn> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!waiter) throw new UnauthorizedException('Sessão inválida');

    const { accessToken } = await this.signIn({
      id: waiter.id,
      role: 'waiter',
      username: waiter.username,
    });

    await this.prisma.session.update({
      where: {
        token: session.token,
      },
      data: {
        token: accessToken,
      },
    });

    return { accessToken };
  }

  private async signIn(user: Express.User): Promise<SignIn> {
    return {
      accessToken: this.jwtService.sign(user),
    };
  }
}
