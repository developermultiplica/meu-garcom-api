import { Restaurant } from '@prisma/client';

export abstract class RestaurantUseCase<Request, Response = Restaurant> {
  abstract handle(request: Request): Promise<Response>;
}
