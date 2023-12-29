import { RestaurantManager } from '../entities/restaurant-manager.entity';

export class PaginatedRestaurantManagersView {
  restaurantManagers: RestaurantManager[];
  matchCount: number;
  numberOfPages: number;
}
