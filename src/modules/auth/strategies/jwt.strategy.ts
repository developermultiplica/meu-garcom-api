import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { jwtSecret } from '../constants/jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: any): typeof request.user {
    return { id: payload.id, username: payload.username, role: payload.role };
  }
}
