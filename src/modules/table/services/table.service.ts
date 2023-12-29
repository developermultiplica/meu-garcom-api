/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';
import { ProductNotFoundException } from '~/modules/restaurant/errors/product-not-found-exception';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '~/modules/restaurant/errors/restaurant-not-fount-exception';
import { WaiterNotFoundException } from '~/modules/waiter/errors/WaiterNotFoundException';

import { TableNotFoundException } from '../errors/TableNotFoundException';

@Injectable()
export class TableService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async setWaiter(tableId: string, body: any): Promise<any> {

        const restaurantManagerId = body.restaurantManagerId;
        const waiterId = body.waiterId;

        //Verifica o Manager
        const restaurantManager = await this.prisma.restaurantManager.findUnique({
            where: {
                id: restaurantManagerId,
            },
        });

        if (!restaurantManager) {
            throw new RestaurantManagerNotFoundException();
        }

        //Verifica Restaurante
        const restaurant = await this.prisma.restaurant.findUnique({
            where: {
                id: restaurantManager.restaurantId,
            },
            include: {
                tables: true,
            },
        });

        if (!restaurant) {
            throw new RestaurantNotFoundException();
        }

        if (isPast(restaurant.expiresAt)) {
            throw new InactiveRestaurantException();
        }

        //Verifica Mesa
        const table = await this.prisma.table.findUnique({
            where: {
                id: tableId,
            },
        });

        if (!table) {
            throw new TableNotFoundException();
        }

        if (table.restaurantId !== restaurant.id) {
            throw new UnauthorizedException();
        }

        //Verifica Garçom
        if (waiterId) {
            const waiter = await this.prisma.waiter.findUnique({
                where: {
                    id: waiterId,
                },
            });

            if (!waiter) {
                throw new WaiterNotFoundException();
            }

            if (waiter.restaurantId !== restaurant.id) {
                throw new BadRequestException(
                    'Apenas garçons do estabelecimento podem ser responsáveis pelas mesas',
                );
            }
        }

        //Atualiza de fato a mesa
        return await this.prisma.table.update({
            where: {
                id: tableId,
            },
            data: {
                waiterId,
            },
        });
    }

    async productName(productId: string): Promise<string> {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!product) {
            throw new ProductNotFoundException();
        }

        return product.name;
    }

    async onesignalId(id: string): Promise<string> {
        console.log('id =>',id);
        
        const customer = await this.prisma.customer.findUnique({
            where: {
              id,
            },
          });
      
          
        console.log('cliente =>',customer);

        if (!customer) {
            throw new Error(`Cliente não encontrado`);
        }

        // Verifica se cliente.onesignal_id não é nulo antes de retorná-lo
        if (customer.onesignal_id === null) {
            throw new Error(`onesignal_id é nulo para o cliente com ID ${id}`);
        }

        return customer.onesignal_id;
    }


}
