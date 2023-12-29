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

import { RestaurantManagerMapper } from '~/modules/restaurant/mappers/restaurant-manager.mapper';
import { RestaurantService } from '~/modules/restaurant/services/restaurant.service';

import { ROLE } from '../constants/role';
import { RecoverDto } from '../dtos/recover.dto';
import { ValidateRestaurantDto } from '../dtos/validate-restaurant.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalRestaurantAuthGuard } from '../guards/local-restaurant-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthRestaurantService } from '../services/auth-restaurant.service';
import { SignInWithRestaurantManager } from '../views/sign-in-with-restaurant-manager.view';

@ApiTags('auth-restaurant')
@Controller('auth/restaurant-manager')
export class RestaurantManagerAuthController {
  constructor(
    private authService: AuthRestaurantService,
    private restaurantService: RestaurantService,
  ) {}

  @ApiOperation({
    summary:
      'Rota utilizada para o gerente do restaurante se logar na aplicação e obter seu token de acesso',
  })
  @UseGuards(LocalRestaurantAuthGuard)
  @Post('sign-in')
  async signIn(
    @Req() req: Request,
    @Body() _body: ValidateRestaurantDto,
  ): Promise<SignInWithRestaurantManager> {
    req.user.role = ROLE.RESTAURANT;
    const { accessToken } = await this.authService.signIn(req.user);

    const restaurantManager = await this.restaurantService.getManagerById(
      req.user.id,
    );
    console.log('log=>' + JSON.stringify(restaurantManager));

    if (!restaurantManager)
      throw new BadRequestException('Usuário não encontrado');

    return {
      accessToken,
      user: RestaurantManagerMapper.toHTTP(restaurantManager),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para receber informações do gerente do restaurante através do token de acesso',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get('/me')
  async getMe(@Req() req: Request) {
    const restaurantManager = await this.restaurantService.getManagerById(
      req.user.id,
    );

    if (!restaurantManager)
      throw new BadRequestException('Usuário não encontrado');

    return RestaurantManagerMapper.toHTTP(restaurantManager);
  }

  @ApiOperation({
    summary: 'Rota utilizada para o gerente do restaurante recuperar sua senha',
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
