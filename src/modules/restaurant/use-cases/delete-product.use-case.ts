/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import { ProductUseCase } from '../abstractions/product-use-case';
import { ProductNotFoundException } from '../errors/product-not-found-exception';

type Request = {
    productId: string;
};

@Injectable()
export class DeleteProduct extends ProductUseCase<Request, void> {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async handle({ productId }: Request): Promise<void> {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new ProductNotFoundException();
        }

        const orderProduct = await this.prisma.orderProduct.findFirst({
            where: {
                // eslint-disable-next-line object-shorthand
                productId: productId,
            },
            include: {
                order: {
                    include: {
                        tableSession: {
                            include: {
                                table: true,
                            },
                        },
                    },
                },
            },
        });
        
        if (orderProduct) {
            await this.prisma.orderProduct.deleteMany({
                where: {
                    productId: orderProduct.productId,
                    orderId: orderProduct.orderId,
                },
            });

            await this.prisma.product.delete({
                where: {
                    id: productId,
                },
            });
        }
        else {
            await this.prisma.product.delete({
                where: {
                    id: productId,
                },
            });
        }
    }
}
