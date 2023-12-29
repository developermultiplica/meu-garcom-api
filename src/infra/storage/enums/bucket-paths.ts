export const BucketPaths = {
  PRODUCT_PHOTO: 'product-photo',
  RESTAURANT_BANNER: 'restaurant-banner',
} as const;
export type BucketPaths = (typeof BucketPaths)[keyof typeof BucketPaths];
