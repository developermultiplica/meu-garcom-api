import { RestaurantManager } from '@prisma/client';

export abstract class RestaurantManagerUseCase<
  Request,
  Response = RestaurantManager,
> {
  abstract handle(request: Request): Promise<Response>;
}
