/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';

import { PasswordEncryptionsService } from '~/infra/encryption/password-encryption.service';
import { PrismaService } from '~/infra/prisma/prisma.service';

import { CreateCustomerDto } from './dtos/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private passwordEncryption: PasswordEncryptionsService,
  ) { }

  async getAllCustomers(): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany();
    return customers;
  }

  async getByUsernameAndPassword(username: string, password: string) {

    const senha = await this.passwordEncryption.encrypt(password);

    const customer = await this.prisma.customer.findFirst({
      where: {
        AND: [
          {
            username,
          },
          {
            password: senha,
          },
        ],
      },
    });

    return customer;
  }

  async getByUsername(username: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        username,
      },
    });

    return customer;
  }

  async getById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) return null;

    return customer;
  }

  async create({ username, name, password, email }: CreateCustomerDto) {
    const phoneAlreadyUsed = await this.prisma.customer.findFirst({
      where: { username },
    });

    if (phoneAlreadyUsed) {
      throw new BadRequestException('Telefone já utilizado');
    }

    const customer = await this.prisma.customer.create({
      data: {
        username,
        name,
        email,
        password: await this.passwordEncryption.encrypt(password),
        onesignal_id: ""
      },
    });

    customer.cart = [];

    return customer;
  }

  async addToCart(customerId: string, productId: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Cliente não encontrado');
    }

    if (!customer.cart.includes(productId)) {
      const updatedCart = [...customer.cart, productId];

      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          cart: updatedCart,
        },
      });
    }

    return customer;
  }

  async removeFromCart(customerId: string, productId: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Cliente não encontrado');
    }

    if (customer.cart.includes(productId)) {
      const updatedCart = customer.cart.filter(id => id !== productId); // Remove o produto do 'cart'

      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          cart: updatedCart,
        },
      });
    }

    return customer;
  }

  async clearCart(customerId: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Cliente não encontrado');
    }

    if (customer.cart.length > 0) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          cart: [],
        },
      });
    }

    return customer;
  }

  async addOnesignal(customerId: string, body: any): Promise<any> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new BadRequestException('Cliente não encontrado');
    }

    return this.prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        onesignal_id: body.onesignal_id,
      },
    });
  }

}
