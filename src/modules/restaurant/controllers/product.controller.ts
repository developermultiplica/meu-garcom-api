/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { PaginationQueryDto } from '~/helpers/dtos/pagination-query.dto';
import { ROLE } from '~/modules/auth/constants/role';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';

import { CreateProductDto } from '../dtos/create-product.dto';
import { ProductIdDto } from '../dtos/product-id.dto';
import { RestaurantIdDto } from '../dtos/restaurant-id.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductMapper } from '../mappers/product.mapper';
import { CreateProduct } from '../use-cases/create-product.use-case';
import { DeleteProduct } from '../use-cases/delete-product.use-case';
import { GetProductsByRestaurantId } from '../use-cases/get-products-by-restaurant-id.use-case';
import { ListProductsByRestaurantManagerId } from '../use-cases/list-products-by-restaurant-manager-id.use-case';
import { UpdateProduct } from '../use-cases/update-product.use-case';
import { PaginatedProductsView } from '../views/paginated-products.view';
import { ProductView } from '../views/product.view';
import { ProductsView } from '../views/products.view';
@ApiBearerAuth()
@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private getProductsByRestaurantId: GetProductsByRestaurantId,
    private listProductsByRestaurantManagerId: ListProductsByRestaurantManagerId,
    private createProduct: CreateProduct,
    private updateProduct: UpdateProduct,
    private deleteProduct: DeleteProduct
  ) { }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de um produto do restaurante a partir do gerente do restaurante logado',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Req() req: Request,
    @Body() body: CreateProductDto,
  ): Promise<ProductView> {
    const product = await this.createProduct.handle({
      ...body,
      estimatedMinutesToPrepare: body.estimatedMinutesToPrepare
        ? Number(body.estimatedMinutesToPrepare)
        : null,
      priceInCents: Number(body.priceInCents),
      availableAmount: Number(body.availableAmount),
      image,
      restaurantManagerId: req.user.id,
    });

    return { product: ProductMapper.toHTTP(product) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem de todos os produtos do restaurante a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Get('restaurant/:restaurantId')
  async getByRestaurantId(
    @Param() { restaurantId }: RestaurantIdDto,
  ): Promise<ProductsView> {
    const products = await this.getProductsByRestaurantId.handle({
      restaurantId,
    });

    return { products: products.map(ProductMapper.toHTTP) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem paginada de produtos a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get()
  async listByRestaurantId(
    @Query() { page }: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedProductsView> {
    const { products, matchCount, numberOfPages } =
      await this.listProductsByRestaurantManagerId.handle({
        restaurantManagerId: req.user.id,
        page,
      });

    return {
      products: products.map(ProductMapper.toHTTP),
      matchCount,
      numberOfPages,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para atualização de um produto a partir do id informado no parâmetro',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @UseInterceptors(FileInterceptor('image'))
  @Put(':productId')
  async update(
    @UploadedFile() image: Express.Multer.File,
    @Req() req: Request,
    @Param() { productId }: ProductIdDto,
    @Body()
    {
      estimatedMinutesToPrepare,
      priceInCents,
      isAvailable,
      availableAmount,
      ...body
    }: UpdateProductDto,
  ): Promise<ProductView> {
    
    const product = await this.updateProduct.handle({
      restaurantManagerId: req.user.id,
      productId,
      ...body,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      availableAmount: availableAmount ? Number(availableAmount) : undefined,
      ...(estimatedMinutesToPrepare !== undefined && {
        estimatedMinutesToPrepare: estimatedMinutesToPrepare
          ? Number(estimatedMinutesToPrepare)
          : null,
      }),
      priceInCents: priceInCents ? Number(priceInCents) : undefined,
      image,
    });

    return {
      product: ProductMapper.toHTTP(product),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para um produto a partir do id informado no parâmetro. Se houver pedidos associados a este produto, eles serão igualmente removidos como parte do processo de exclusão.',
  })
  @Delete(':productId')
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('productId') productId: string,
  ): Promise<void> {
    await this.deleteProduct.handle({
      productId,
    });
    res.status(200).json({ message: 'Produto excluído com sucesso.' });
  }
}
