/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ShortUniqueId from 'short-unique-id';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { MailService } from '~/infra/mail/mail.service';
import { PrismaService } from '~/infra/prisma/prisma.service';

import { RecoverDto } from '../dtos/recover.dto';
import { ValidateProviderDto } from '../dtos/validate-provider.dto';
import { SignIn } from '../views/sign-in.view';

@Injectable()
export class AuthProviderService {
  constructor(
    private jwtService: JwtService,
    private passwordEncryption: PasswordEncryptionsService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async validate({ username, password }: ValidateProviderDto) {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        username,
      },
    });

    if (!providerManager) {
      throw new UnauthorizedException('Email incorreto');
    }

    const isPasswordCorrect = await this.passwordEncryption.compare({
      password,
      encryptedPassword: providerManager.password,
    });

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const { id, name } = providerManager;
    return { id, name, username };
  }

  async signIn(provider: Express.User): Promise<SignIn> {
    const accessToken = this.jwtService.sign(provider);

    await this.prisma.session.create({
      data: {
        role: 'PROVIDER_MANAGER',
        token: accessToken,
        userId: provider.id,
      },
    });

    return {
      accessToken,
    };
  }

  async recover({ username }: RecoverDto) {
    const providerManager = await this.prisma.providerManager.findUnique({
      where: {
        username,
      },
    });

    if (!providerManager) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });

    const password = String(uid()).toLowerCase();

    await this.prisma.$transaction(async (tx) => {
      await tx.providerManager.update({
        where: {
          username,
        },
        data: {
          password: await this.passwordEncryption.encrypt(password),
        },
      });

      await this.mailService.sendEmail({
        to: providerManager.username!,
        subject: 'Recuperação de senha',
        context: {
          name: providerManager.name,
          password,
        },
      });
    });
  }
}
