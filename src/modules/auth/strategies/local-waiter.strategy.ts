/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthWaiterService } from '../services/auth-waiter.service';

@Injectable()
export class LocalWaiterStrategy extends PassportStrategy(
  Strategy,
  'waiter-local',
) {
  constructor(private authService: AuthWaiterService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const waiterManager = await this.authService.validate({
      username,
      password,
    });

    return waiterManager;
  }
}
