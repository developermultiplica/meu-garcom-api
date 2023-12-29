/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isPast } from 'date-fns';
import ShortUniqueId from 'short-unique-id';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { MailTemplates } from '~/infra/mail/enums/templates';
import { MailService } from '~/infra/mail/mail.service';
import { PrismaService } from '~/infra/prisma/prisma.service';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';
import { RestaurantService } from '~/modules/restaurant/services/restaurant.service';

import { RecoverDto } from '../dtos/recover.dto';
import { ValidateRestaurantDto } from '../dtos/validate-restaurant.dto';
import { SignIn } from '../views/sign-in.view';

@Injectable()
export class AuthRestaurantService {
  constructor(
    private restaurantService: RestaurantService,
    private jwtService: JwtService,
    private passwordEncryption: PasswordEncryptionsService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async validate({ username, password }: ValidateRestaurantDto) {
    const restaurantManager = await this.restaurantService.getManagerByUsername(
      username,
    );

    if (restaurantManager && isPast(restaurantManager.restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    if (!restaurantManager) {
      throw new UnauthorizedException('Email incorreto');
    }

    const isPasswordCorrect = await this.passwordEncryption.compare({
      password,
      encryptedPassword: restaurantManager.password,
    });

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const { id, name } = restaurantManager;
    return { id, name, username };

  }

  async signIn(restaurant: Express.User): Promise<SignIn> {
    const accessToken = this.jwtService.sign(restaurant);

    await this.prisma.session.create({
      data: {
        role: 'RESTAURANT_MANAGER',
        token: accessToken,
        userId: restaurant.id,
      },
    });

    return {
      accessToken,
    };
  }

  async recover({ username }: RecoverDto) {
    const restaurantManager = await this.restaurantService.getManagerByUsername(
      username,
    );

    if (!restaurantManager) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });

    const password = String(uid()).toLowerCase();

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantManager.update({
        where: {
          username,
        },
        data: {
          password: await this.passwordEncryption.encrypt(password),
        },
      });

      await this.mailService.sendEmail({
        to: restaurantManager.username,
        subject: 'Recuperação de senha',
        template: MailTemplates.RECOVER_PASSWORD,
        context: {
          name: restaurantManager.name,
          password,
        },
      });
    });
  }
}
