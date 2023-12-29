import { Controller, Put, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from '../services/auth.service';

@ApiTags('auth-common')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary:
      'Rota utilizada para qualquer tipo de usuário atualizar seu token de acesso',
  })
  @ApiBearerAuth()
  @Put('refresh-token')
  async refreshToken(@Req() request: Request) {
    if (
      !request.headers.authorization ||
      typeof request.headers.authorization !== 'string'
    ) {
      throw new UnauthorizedException('Token invalido');
    }

    return this.authService.refreshToken(
      request.headers.authorization.replace('Bearer ', ''),
    );
  }
}
