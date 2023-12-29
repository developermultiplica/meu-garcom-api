/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Customer } from '@prisma/client';

import { CustomerService } from '../customer.service';
import { UpdateCustomerOnesignalIdDto } from '../dtos/create-customer.dto';

@ApiTags('costumers')
@Controller('costumers')
export class CustomerController {
  constructor(private customerService: CustomerService) { }

  @ApiOperation({
    summary:
      'Rota utilizada para adicionar um produto no carrinho a partir dos ids do cliente e do produto',
  })
  @Put('add/:customerId/:productId')
  async addToCart(
    @Param('customerId') customerId: string,
    @Param('productId') productId: string,
  ): Promise<Customer> {
    const updatedCustomer = await this.customerService.addToCart(
      customerId,
      productId,
    );
    return updatedCustomer;
  }

  @ApiOperation({
    summary:
      'Rota utilizada para remover um produto no carrinho a partir dos ids do cliente e do produto',
  })
  @Put('del/:customerId/:productId')
  async rmvToCart(
    @Param('customerId') customerId: string,
    @Param('productId') productId: string,
  ): Promise<Customer> {
    const updatedCustomer = await this.customerService.removeFromCart(
      customerId,
      productId,
    );
    return updatedCustomer;
  }

  @ApiOperation({
    summary: 'Rota utilizada para atualização do campo onesignal_id de um cliente',
  })
  @ApiBody({ type: UpdateCustomerOnesignalIdDto })
  @Patch(':customerId/onesignal')
  async addOnesignal(@Param('customerId') customerId: string, @Body() body: any): Promise<any> {
    return this.customerService.addOnesignal(customerId, body);
  }

  @ApiOperation({
    summary:
      'Rota utilizada para remover todos produtos no carrinho a partir do id do cliente',
  })
  @Put('clear/:customerId')
  async clearCart(
    @Param('customerId') customerId: string,
  ): Promise<Customer> {
    const updatedCustomer = await this.customerService.clearCart(
      customerId,
    );
    return updatedCustomer;
  }


}