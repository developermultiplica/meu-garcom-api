import { Product } from '../entities/product.entity';

export class PaginatedProductsView {
  products: Product[];
  matchCount: number;
  numberOfPages: number;
}
