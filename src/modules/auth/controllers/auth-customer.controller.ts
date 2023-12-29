import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RateLimit, RateLimiterGuard } from 'nestjs-rate-limiter';

import { CustomerService } from '~/modules/customer/customer.service';
import { CreateCustomerDto } from '~/modules/customer/dtos/create-customer.dto';
import { CustomerMapper } from '~/modules/customer/mappers/customer.mapper';
import { GetActiveTableSessionByCustomerId } from '~/modules/table/use-cases/get-active-table-session-by-customer-id.use-case';

import { ROLE } from '../constants/role';
import { RecoverDto } from '../dtos/recover.dto';
import { ValidateCustomerDto } from '../dtos/validate-customer.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalCustomerAuthGuard } from '../guards/local-customer-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthCustomerService } from '../services/auth-customer.service';
import { SignInWithCustomer } from '../views/sign-in-with-customer.view';

@ApiTags('auth-customer')
@Controller('auth/customer')
export class CustomerAuthController {
  constructor(
    private authService: AuthCustomerService,
    private customerService: CustomerService,
    private getActiveTableSessionByCustomerId: GetActiveTableSessionByCustomerId,
  ) {}

  @ApiOperation({
    summary: 'Rota utilizada para cadastro de um cliente',
  })
  @Post('sign-up')
  async signUp(@Body() body: CreateCustomerDto) {
    await this.authService.signUp(body);
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o cliente se logar na aplicação e obter seu token de acesso',
  })
  @UseGuards(LocalCustomerAuthGuard)
  @Post('sign-in')
  async signIn(
    @Req() req: Request,
    @Body() _body: ValidateCustomerDto,
  ): Promise<SignInWithCustomer> {
    req.user.role = ROLE.CUSTOMER;
    const { accessToken } = await this.authService.signIn(req.user);

    const customer = await this.customerService.getById(req.user.id);

    if (!customer) throw new BadRequestException('Usuário não encontrado');

    const activeTableSession =
      await this.getActiveTableSessionByCustomerId.handle({
        customerId: customer.id,
      });

    return {
      accessToken,
      user: CustomerMapper.toHTTP(customer, activeTableSession?.id),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para receber informações do cliente através do token de acesso',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Get('/me')
  async getMe(@Req() req: Request) {
    const customer = await this.customerService.getById(req.user.id);

    if (!customer) throw new BadRequestException('Usuário não encontrado');

    const activeTableSession =
      await this.getActiveTableSessionByCustomerId.handle({
        customerId: customer.id,
      });

    return CustomerMapper.toHTTP(customer, activeTableSession?.id);
  }

  @ApiOperation({
    summary: 'Rota utilizada para o cliente recuperar sua senha',
  })
  @UseGuards(RateLimiterGuard)
  @RateLimit({
    keyPrefix: 'recover',
    points: 1,
    duration: 30,
    logger: true,
    customResponseSchema(rateLimiterResponse) {
      throw new HttpException(
        {
          error: 'Too many requests',
          code: HttpStatus.TOO_MANY_REQUESTS,
          message: `Você já solicitou sua alteração de senha, você só poderá solicitar novamente em ${Math.ceil(
            rateLimiterResponse.msBeforeNext / 1000,
          )} segundos`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  })
  @Patch('recover')
  async recover(@Body() body: RecoverDto) {
    await this.authService.recover(body);
  }
}
