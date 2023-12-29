import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalRestaurantAuthGuard extends AuthGuard('restaurant-local') {}
