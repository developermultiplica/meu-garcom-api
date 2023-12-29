import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RateLimit, RateLimiterGuard } from 'nestjs-rate-limiter';

import { WaiterMapper } from '~/modules/waiter/mappers/waiter.mapper';
import { WaiterService } from '~/modules/waiter/waiter.service';

import { ROLE } from '../constants/role';
import { RecoverDto } from '../dtos/recover.dto';
import { ValidateWaiterDto } from '../dtos/validate-waiter.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalWaiterAuthGuard } from '../guards/local-waiter-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthWaiterService } from '../services/auth-waiter.service';
import { SignInWithWaiter } from '../views/sign-in-with-waiter.view';

@ApiTags('auth-waiter')
@Controller('auth/waiter')
export class WaiterAuthController {
  constructor(
    private authService: AuthWaiterService,
    private waiterService: WaiterService,
  ) {}

  @ApiOperation({
    summary:
      'Rota utilizada para o garçom se logar na aplicação e obter seu token de acesso',
  })
  @UseGuards(LocalWaiterAuthGuard)
  @Post('sign-in')
  async signIn(
    @Req() req: Request,
    @Body() _body: ValidateWaiterDto,
  ): Promise<SignInWithWaiter> {
    req.user.role = ROLE.WAITER;
    const { accessToken } = await this.authService.signIn(req.user);

    const waiter = await this.waiterService.getById(req.user.id);

    if (!waiter) throw new BadRequestException('Usuário não encontrado');

    return {
      accessToken,
      user: WaiterMapper.toHTTP(waiter),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para receber informações do garçom através do token de acesso',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.WAITER))
  @Get('/me')
  async getMe(@Req() req: Request) {
    const waiter = await this.waiterService.getById(req.user.id);

    if (!waiter) throw new BadRequestException('Usuário não encontrado');

    return WaiterMapper.toHTTP(waiter);
  }

  @ApiOperation({
    summary: 'Rota utilizada para o garçom recuperar sua senha',
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
