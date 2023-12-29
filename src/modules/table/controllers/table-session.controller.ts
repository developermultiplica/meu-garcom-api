/* eslint-disable prettier/prettier */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RateLimit, RateLimiterGuard } from 'nestjs-rate-limiter';

import { SocketIoGateway } from '~/infra/web-socket/socket-io.gateway';
import { ROLE } from '~/modules/auth/constants/role';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';
import { NotificationService } from '~/modules/notification/notification.service';

import { CreateOrderDto } from '../dtos/create-order.dto';
import { CreateTableSessionDto } from '../dtos/create-table-session.dto';
import { GetTableSessionByIdDto } from '../dtos/get-table-session-by-id.dto';
import { JoinTableSessionDto } from '../dtos/join-table-session.dto';
import { TableSessionNotFoundException } from '../errors/TableSessionNotFoundException';
import { TableSessionMapper } from '../mappers/table-session';
import { CreateTableSession } from '../use-cases/create-table-session.use-case';
import { FinishTableSession } from '../use-cases/finish-table-session.use-case';
import { GetTableSessionById } from '../use-cases/get-table-session-by-id.use-case';
import { JoinTableSession } from '../use-cases/join-table-session.use-case';
import { RequestTableSessionOrder } from '../use-cases/request-table-session-order.use-case';
import { RequestTableSessionPayment } from '../use-cases/request-table-session-payment.use-case';
import { TableSessionViewPossibleNull } from '../views/table-session-possible-null.view';
import { TableSessionView } from '../views/table-session.view';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('table-session')
@Controller('table-sessions')
export class TableSessionController {
  constructor(
    private socket: SocketIoGateway,
    private createTableSession: CreateTableSession,
    private getTableSessionById: GetTableSessionById,
    private requestTableSessionOrder: RequestTableSessionOrder,
    private joinTableSession: JoinTableSession,
    private requestTableSessionPayment: RequestTableSessionPayment,
    private finishTableSession: FinishTableSession,
    private notificationService: NotificationService
  ) { }

  @ApiOperation({
    summary:
      'Rota utilizada para receber a sessão da mesa pelo id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER, ROLE.RESTAURANT))
  @Get(':tableSessionId')
  async getById(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
  ): Promise<TableSessionViewPossibleNull> {
    const tableSession = await this.getTableSessionById.handle({
      id: tableSessionId,
    });

    return {
      tableSession: tableSession
        ? TableSessionMapper.toHTTP(tableSession)
        : null,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de uma sessão na mesa a partir do cliente logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateTableSessionDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.createTableSession.handle({
      tableId: body.tableId,
      customerId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'new-table-session',
      tableSessionId: mappedTableSession.id,
      content: mappedTableSession,
    });
    //Chamar a função
    if (mappedTableSession.waiter_notification_id) {
      const title = `Nova sessão: Mesa ${mappedTableSession.tableNumber}`;
      const subtitle = `Mesa ${mappedTableSession.tableNumber} abriu uma nova conta.`
      await this.notificationService.sendOSNotification(
        mappedTableSession.waiter_notification_id,
        title,
        subtitle
      );
    }
    return { tableSession: mappedTableSession };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de um pedido na sessão da mesa a partir do cliente logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Post('/:tableSessionId/order')
  async createOrder(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
    @Req() req: Request,
    @Body() body: CreateOrderDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.requestTableSessionOrder.handle({
      tableSessionId,
      customerId: req.user.id,
      products: body.products,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'new-order',
      tableSessionId,
      content: mappedTableSession,
    });

    // Envia a notificacao se tiver onesignal_id
    if (mappedTableSession.waiter_notification_id) {
      const title = `Novo Pedido: Mesa ${mappedTableSession.tableNumber}`;
      const subtitle = `Mesa ${mappedTableSession.tableNumber} solicitou um pedido.`
      await this.notificationService.sendOSNotification(
        mappedTableSession.waiter_notification_id,
        title,
        subtitle
      );
    }

    return { tableSession: mappedTableSession };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o cliente logado participar da sessão da mesa a partir do id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER))
  @Post('/:tableSessionId/join')
  async join(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
    @Req() req: Request,
    @Body() { password }: JoinTableSessionDto,
  ): Promise<TableSessionView> {
    const tableSession = await this.joinTableSession.handle({
      tableSessionId,
      customerId: req.user.id,
      password,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'new-participant',
      tableSessionId,
      content: mappedTableSession,
    });

    return { tableSession: mappedTableSession };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o cliente, garçom ou gerente do restaurante logado solicitar o pagamento da sessão da mesa',
  })
  @UseGuards(
    JwtAuthGuard,
    new RoleGuard(ROLE.CUSTOMER, ROLE.WAITER, ROLE.RESTAURANT),
  )
  @Patch('/:tableSessionId/request-payment')
  async requestPayment(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
    @Req() req: Request,
  ): Promise<TableSessionView> {
    if (req.user.role === 'provider') {
      throw new UnauthorizedException();
    }

    const tableSession = await this.requestTableSessionPayment.handle({
      tableSessionId,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'table-session-payment-requested',
      tableSessionId,
      content: mappedTableSession,
    });
    // Envia a notificacao se tiver onesignal_id
    if (mappedTableSession.waiter_notification_id) {
      const title = `Solicitação de Pagamento: Mesa ${mappedTableSession.tableNumber}`;
      const subtitle = `Mesa ${mappedTableSession.tableNumber} está aguardando o pagamento.`
      await this.notificationService.sendOSNotification(
        mappedTableSession.waiter_notification_id,
        title,
        subtitle
      );
    }

    return { tableSession: mappedTableSession };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o gerente do restaurante logado finalizar a sessão da mesa',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Patch('/:tableSessionId/finish')
  async finish(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
    @Req() req: Request,
  ): Promise<TableSessionView> {
    const tableSession = await this.finishTableSession.handle({
      tableSessionId,
      restaurantManagerId: req.user.id,
    });

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'table-session-finished',
      tableSessionId,
      content: mappedTableSession,
    });

    return { tableSession: mappedTableSession };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para o cliente logado solicitar a presença do garçom na mesa',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({
    keyPrefix: 'call-waiter',
    points: 1,
    duration: 30,
    logger: true,
    customResponseSchema(rateLimiterResponse) {
      throw new HttpException(
        {
          error: 'Too many requests',
          code: HttpStatus.TOO_MANY_REQUESTS,
          message: `Você já solicitou a presença do garçom recentemente, você só poderá solicitar novamente em ${Math.ceil(
            rateLimiterResponse.msBeforeNext / 1000,
          )} segundos`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    },
  })
  @UseGuards(RateLimiterGuard, new RoleGuard(ROLE.CUSTOMER))
  @Post('/:tableSessionId/call-waiter')
  async callWaiter(
    @Param() { tableSessionId }: GetTableSessionByIdDto,
    @Req() req: Request,
  ): Promise<void> {
    const tableSession = await this.getTableSessionById.handle({
      id: tableSessionId,
    });

    if (!tableSession) {
      throw new TableSessionNotFoundException();
    }

    if (!tableSession.table.waiterId) {
      throw new BadRequestException(
        'Essa sessão não possui um garçom atrelado à ela, comunique à gerencia do estabelecimento',
      );
    }

    if (
      tableSession.tableParticipants.every(
        (tableParticipant) => tableParticipant.customerId !== req.user.id,
      )
    ) {
      throw new UnauthorizedException();
    }

    const mappedTableSession = TableSessionMapper.toHTTP(tableSession);

    this.socket.emitMessage({
      subject: 'table-session-waiter-called',
      tableSessionId,
      content: mappedTableSession,
    });
    // Envia a notificacao se tiver onesignal_id
    if (mappedTableSession.waiter_notification_id) {
      const title = `Solicitação de Presença: Mesa ${mappedTableSession.tableNumber}`;
      const subtitle = `Mesa ${mappedTableSession.tableNumber} solicitou sua presença.`
      await this.notificationService.sendOSNotification(
        mappedTableSession.waiter_notification_id,
        title,
        subtitle
      );
    }
  }
}
