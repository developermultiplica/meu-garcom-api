import {
  Injectable,
  CanActivate,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { ROLE } from '../constants/role';
import { UnauthorizedException } from '../errors/UnauthorizedException';

@Injectable()
export class RoleGuard implements CanActivate {
  private roles: ROLE[] = [];
  constructor(...roles: ROLE[]) {
    if (roles.length === 0)
      throw new Error('You must specify at least one role');

    this.roles = roles;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const userRole = request.user.role;

    if (!userRole)
      throw new InternalServerErrorException('User role not defined');

    const isUserAllowed = this.roles.includes(userRole);

    if (!isUserAllowed) throw new UnauthorizedException();

    return true;
  }
}
