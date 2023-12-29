/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthProviderService } from '../services/auth-provider.service';

@Injectable()
export class LocalProviderStrategy extends PassportStrategy(
  Strategy,
  'provider-local',
) {
  constructor(private authService: AuthProviderService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const providerManager = await this.authService.validate({
      username,
      password,
    });

    return providerManager;
  }
}
