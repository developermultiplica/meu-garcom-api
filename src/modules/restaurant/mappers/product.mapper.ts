import { ProductWithIncludes } from '../abstractions/product-use-case';
import { Product } from '../entities/product.entity';

export abstract class ProductMapper {
  static toHTTP(product: ProductWithIncludes): Product {
    return {
      id: product.id,
      restaurantId: product.restaurantId,
      name: product.name,
      description: product.description,
      category: {
        id: product.category.id,
        name: product.category.name,
        restaurantId: product.category.restaurantId,
      },
      availabilityType: product.availabilityType,
      isAvailable: product.isAvailable,
      availableAmount: product.availableAmount,
      imageUrl: product.imageUrl,
      estimatedMinutesToPrepare: product.estimatedMinutesToPrepare,
      priceInCents: product.priceInCents,
    };
  }
}
