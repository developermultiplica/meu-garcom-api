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

import { ProviderManagerMapper } from '~/modules/provider/mappers/provider-manager.mapper';
import { ProviderService } from '~/modules/provider/provider.service';

import { ROLE } from '../constants/role';
import { RecoverDto } from '../dtos/recover.dto';
import { ValidateProviderDto } from '../dtos/validate-provider.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalProviderAuthGuard } from '../guards/local-provider-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthProviderService } from '../services/auth-provider.service';
import { SignInWithProviderManager } from '../views/sign-in-with-provider-manager.view';

@ApiTags('auth-provider')
@Controller('auth/provider-manager')
export class ProviderManagerAuthController {
  constructor(
    private authService: AuthProviderService,
    private providerService: ProviderService,
  ) {}

  @ApiOperation({
    summary:
      'Rota utilizada para o provedor se logar na aplicação e obter seu token de acesso',
  })
  @UseGuards(LocalProviderAuthGuard)
  @Post('sign-in')
  async signIn(
    @Req() req: Request,
    @Body() _body: ValidateProviderDto,
  ): Promise<SignInWithProviderManager> {
    req.user.role = ROLE.PROVIDER;
    const { accessToken } = await this.authService.signIn(req.user);

    const providerManager = await this.providerService.getManagerById(
      req.user.id,
    );

    if (!providerManager)
      throw new BadRequestException('Usuário não encontrado');

    return { accessToken, user: ProviderManagerMapper.toHTTP(providerManager) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para receber informações do provedor através do token de acesso',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.PROVIDER))
  @Get('/me')
  async getMe(@Req() req: Request) {
    const providerManager = await this.providerService.getManagerById(
      req.user.id,
    );

    if (!providerManager)
      throw new BadRequestException('Usuário não encontrado');

    return ProviderManagerMapper.toHTTP(providerManager);
  }

  @ApiOperation({
    summary: 'Rota utilizada para o provedor recuperar sua senha',
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
