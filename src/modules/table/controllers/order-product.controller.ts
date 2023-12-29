/* eslint-disable prettier/prettier */
import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Subject } from '~/infra/web-socket/enums/subjects';
import { SocketIoGateway } from '~/infra/web-socket/socket-io.gateway';
import { ROLE } from '~/modules/auth/constants/role';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';
import { NotificationService } from '~/modules/notification/notification.service';

import { CancelOrderProductDto } from '../dtos/cancel-order-product.dto';
import { TableSessionMapper } from '../mappers/table-session';
import { TableService } from '../services/table.service';
import { CancelOrderProductWaiter } from '../use-cases/cancel-order-product-waiter.use-case';
import { CancelOrderProduct } from '../use-cases/cancel-order-product.use-case';
import { ServeOrderProductWaiter } from '../use-cases/serve-order-product-waiter.use-case';
import { ServeOrderProduct } from '../use-cases/serve-order-product.use-case';
import { TableSessionView } from '../views/table-session.view';

@ApiTags('order-products')
@ApiBearerAuth()
@Controller()
export class OrderProductController {
  constructor(
    private socket: SocketIoGateway,
    private cancelOrderProduct: CancelOrderProduct,
    private serveOrderProduct: ServeOrderProduct,
    private cancelOrderProductWaiter: CancelOrderProductWaiter,
    private serveOrderProductWaiter: ServeOrderProductWaiter,
    private tableService: TableService,
    private notificationService: NotificationService
  ) { }

  @ApiOperation({
    summary:
      'Rota utilizada para o gerente do restaurante cancelar um produto de um pedido',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Patch('order/:orderId/product/:productId/cancel')
  async cancel(
    @Req() req: Request,
    @Param() { orderId, productId }: CancelOrderProductDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.cancelOrderProduct.handle({
      orderId,
      productId,
      restaurantManagerId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: Subject.TABLE_SESSION_ORDER_PRODUCT_CANCELED,
      tableSessionId: tableSession.id,
      content: mappedTableSession,
    });
    
    const productName = await this.tableService.productName(productId);
    const title = `Produto ${productName} cancelado`;
    const subtitle = `O Produto ${productName} foi cancelado. Entre em contato com o garçom para mais informações.`;
    
    const participants = mappedTableSession.participants;
    
    // Array de IDs de participantes
    const participantIds = participants.map((participant) => participant.customerId);
    
    for (const participantId of participantIds) {
      console.log('participantes => ',participants);
      const onesignal_id = await this.tableService.onesignalId(participantId);
      // Envia a notificacao
      await this.notificationService.sendOSNotification(onesignal_id, title, subtitle);
    }

    return {
      tableSession: mappedTableSession,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o gerente do restaurante marcar como entregue um produto de um pedido',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Patch('order/:orderId/product/:productId/serve')
  async serve(
    @Req() req: Request,
    @Param() { orderId, productId }: CancelOrderProductDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.serveOrderProduct.handle({
      orderId,
      productId,
      restaurantManagerId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: Subject.TABLE_SESSION_ORDER_PRODUCT_SERVED,
      tableSessionId: tableSession.id,
      content: mappedTableSession,
    });

    const productName = await this.tableService.productName(productId);
    const title = `Produto ${productName} servido`;
    const subtitle = `Pedido atendido com sucesso: Produto ${productName} foi servido na sua mesa.`;

    const participants = mappedTableSession.participants;

    // Array de IDs de participantes
    const participantIds = participants.map((participant) => participant.customerId);

    for (const participantId of participantIds) {
      const onesignal_id = await this.tableService.onesignalId(participantId);
      // Envia a notificacao
      await this.notificationService.sendOSNotification(onesignal_id, title, subtitle);
    }

    return {
      tableSession: mappedTableSession,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o garçom do restaurante cancelar um produto de um pedido',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.WAITER))
  @Patch('order/:orderId/product/:productId/cancel/waiter')
  async cancelWaiter(
    @Req() req: Request,
    @Param() { orderId, productId }: CancelOrderProductDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.cancelOrderProductWaiter.handle({
      orderId,
      productId,
      waiterId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: Subject.TABLE_SESSION_ORDER_PRODUCT_CANCELED,
      tableSessionId: tableSession.id,
      content: mappedTableSession,
    });

    const productName = await this.tableService.productName(productId);
    const title = `Produto ${productName} cancelado`;
    const subtitle = `O Produto ${productName} foi cancelado. Entre em contato com o garçom para mais informações.`;

    const participants = mappedTableSession.participants;

    // Array de IDs de participantes
    const participantIds = participants.map((participant) => participant.customerId);

    for (const participantId of participantIds) {
      const onesignal_id = await this.tableService.onesignalId(participantId);
      // Envia a notificacao
      await this.notificationService.sendOSNotification(onesignal_id, title, subtitle);
    }

    return {
      tableSession: mappedTableSession,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o garçom do restaurante marcar como entregue um produto de um pedido',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.WAITER))
  @Patch('order/:orderId/product/:productId/serve/waiter')
  async serveWaiter(
    @Req() req: Request,
    @Param() { orderId, productId }: CancelOrderProductDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.serveOrderProductWaiter.handle({
      orderId,
      productId,
      waiterId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: Subject.TABLE_SESSION_ORDER_PRODUCT_SERVED,
      tableSessionId: tableSession.id,
      content: mappedTableSession,
    });

    const productName = await this.tableService.productName(productId);
    const title = `Produto ${productName} servido`;
    const subtitle = `Pedido atendido com sucesso: Produto ${productName} foi servido na sua mesa.`;

    const participants = mappedTableSession.participants;

    // Array de IDs de participantes
    const participantIds = participants.map((participant) => participant.customerId);

    for (const participantId of participantIds) {
      const onesignal_id = await this.tableService.onesignalId(participantId);
      // Envia a notificacao
      await this.notificationService.sendOSNotification(onesignal_id, title, subtitle);
    }

    return {
      tableSession: mappedTableSession,
    };
  }
}
