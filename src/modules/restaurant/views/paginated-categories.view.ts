import { Category } from '../entities/category.entity';

export class PaginatedCategoriesView {
  categories: Category[];
  matchCount: number;
  numberOfPages: number;
}
