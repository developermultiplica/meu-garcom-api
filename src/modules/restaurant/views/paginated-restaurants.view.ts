import { Restaurant } from '../entities/restaurant.entity';

export class PaginatedRestaurantsView {
  restaurants: Restaurant[];
  matchCount: number;
  numberOfPages: number;
}
