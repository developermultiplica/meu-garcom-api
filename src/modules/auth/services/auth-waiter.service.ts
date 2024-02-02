/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ShortUniqueId from 'short-unique-id';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { MailService } from '~/infra/mail/mail.service';
import { PrismaService } from '~/infra/prisma/prisma.service';
import { WaiterService } from '~/modules/waiter/waiter.service';

import { RecoverDto } from '../dtos/recover.dto';
import { ValidateWaiterDto } from '../dtos/validate-waiter.dto';
import { SignIn } from '../views/sign-in.view';

@Injectable()
export class AuthWaiterService {
  constructor(
    private waiterService: WaiterService,
    private jwtService: JwtService,
    private passwordEncryption: PasswordEncryptionsService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async validate({ username, password }: ValidateWaiterDto) {
    const waiter = await this.waiterService.getByUsername(username);

    if (!waiter) {
      throw new UnauthorizedException('Email incorreto');
    }

    const isPasswordCorrect = await this.passwordEncryption.compare({
      password,
      encryptedPassword: waiter.password,
    });

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const { id, name } = waiter;
    return { id, name, username };
  }

  async signIn(waiter: Express.User): Promise<SignIn> {
    const accessToken = this.jwtService.sign(waiter);

    await this.prisma.session.create({
      data: {
        role: 'WAITER',
        token: accessToken,
        userId: waiter.id,
      },
    });

    return {
      accessToken,
    };
  }

  async recover({ username }: RecoverDto) {
    const waiter = await this.waiterService.getByUsername(username);

    if (!waiter) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });

    const password = String(uid()).toLowerCase();

    await this.prisma.$transaction(async (tx) => {
      await tx.waiter.update({
        where: {
          username,
        },
        data: {
          password: await this.passwordEncryption.encrypt(password),
        },
      });

      await this.mailService.sendEmail({
        to: waiter.username!,
        subject: 'Recuperação de senha',
        context: {
          name: waiter.name,
          password,
        },
      });
    });
  }
}
