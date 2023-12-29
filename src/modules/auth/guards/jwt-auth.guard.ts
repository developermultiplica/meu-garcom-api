import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';

import { ROLE } from '../constants/role';

interface User {
  id: string;
  username: string;
  role: ROLE;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements IAuthGuard {
  logger = new Logger('JwtAuthGuard');

  handleRequest<TUser = User>(_err: Error, user: User): TUser {
    if (user) return user as TUser;
    this.logger.warn({
      status: 498,
      message: 'Token inválido',
      error: 'Invalid Token',
    });
    throw new HttpException(
      {
        status: 498,
        message: 'Token inválido',
        error: 'Invalid Token',
      },
      498,
    );
  }
}
