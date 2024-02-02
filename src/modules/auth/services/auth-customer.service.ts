/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ShortUniqueId from 'short-unique-id';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { MailService } from '~/infra/mail/mail.service';
import { PrismaService } from '~/infra/prisma/prisma.service';
import { SmsService } from '~/infra/sms/sms.service';
import { CustomerService } from '~/modules/customer/customer.service';
import { CreateCustomerDto } from '~/modules/customer/dtos/create-customer.dto';

import { RecoverDto } from '../dtos/recover.dto';
import { ValidateCustomerDto } from '../dtos/validate-customer.dto';
import { SignIn } from '../views/sign-in.view';

@Injectable()
export class AuthCustomerService {
  constructor(
    private customerService: CustomerService,
    private jwtService: JwtService,
    private passwordEncryption: PasswordEncryptionsService,
    private mailService: MailService,
    private smsService: SmsService,
    private prisma: PrismaService,
  ) { }

  async validate({ username, password }: ValidateCustomerDto) {
    const customer = await this.customerService.getByUsername(username);

    if (!customer) {
      throw new UnauthorizedException('Telefone incorreto');
    }

    const isPasswordCorrect = await this.passwordEncryption.compare({
      password,
      encryptedPassword: customer.password,
    });

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const { id, name } = customer;
    return { id, name, username };
  }

  async signIn(customer: Express.User): Promise<SignIn> {
    const accessToken = this.jwtService.sign(customer);

    await this.prisma.session.create({
      data: {
        role: 'CUSTOMER',
        token: accessToken,
        userId: customer.id,
      },
    });

    return {
      accessToken,
    };
  }

  async signUp(data: CreateCustomerDto) {
    return this.customerService.create(data);
  }

  async recover({ username }: RecoverDto) {
    const customer = await this.customerService.getByUsername(username);

    if (!customer) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });

    const password = String(uid()).toLowerCase();

    if (!!customer.email) {
      await this.prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: {
            username,
          },
          data: {
            password: await this.passwordEncryption.encrypt(password),
          },
        });

        await this.mailService.sendEmail({
          to: customer.email!,
          subject: 'Recuperação de senha',
          context: {
            name: customer.name,
            password,
          },
        });
      });

      return;
    }
  }
}