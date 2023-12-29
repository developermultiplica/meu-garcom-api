/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthRestaurantService } from '../services/auth-restaurant.service';

@Injectable()
export class LocalRestaurantStrategy extends PassportStrategy(
  Strategy,
  'restaurant-local',
) {
  constructor(private authService: AuthRestaurantService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const restaurantManager = await this.authService.validate({
      username,
      password,
    });

    return restaurantManager;
  }
}
