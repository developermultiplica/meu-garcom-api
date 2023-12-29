import { Category, Prisma, Product } from '@prisma/client';

export type ProductWithIncludes = Product & {
  category: Category;
};

export abstract class ProductUseCase<Request, Response = ProductWithIncludes> {
  protected productInclude = {
    category: true,
  } satisfies Prisma.ProductInclude;

  abstract handle(request: Request): Promise<Response>;
}
