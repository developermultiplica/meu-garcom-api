/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthCustomerService } from '../services/auth-customer.service';

@Injectable()
export class LocalCustomerStrategy extends PassportStrategy(
  Strategy,
  'customer-local',
) {
  constructor(private authService: AuthCustomerService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const customer = await this.authService.validate({ username, password });
    return customer;
  }
}
