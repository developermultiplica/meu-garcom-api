/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';

import { ROLE } from '~/modules/auth/constants/role';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';

import { TableWithIncludes } from '../abstractions/table-use-case';
import { GetTableByIdDto } from '../dtos/get-table-by-id.dto';
import { SingWaiterToTable } from '../dtos/sing-waiter-to-table.dto';
import { TableMapper } from '../mappers/table';
import { TableSessionMapper } from '../mappers/table-session';
import { TableService } from '../services/table.service';
import { CreateTable } from '../use-cases/create-table.use-case';
import { GetActiveTableSessionByTableId } from '../use-cases/get-active-table-session-by-table-id.use-case';
import { GetRestaurantTables } from '../use-cases/get-restaurant-tables.use-case';
import { GetWaiterTables } from '../use-cases/get-waiter-tables.use-case';
import { TableSessionViewPossibleNull } from '../views/table-session-possible-null.view';
import { TableView } from '../views/table.view';
import { TablesView } from '../views/tables.view';

type BodyTable = {
  tables: number;
};
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('tables')
@Controller('tables')
export class TableController {
  constructor(
    private getActiveTableSessionByTableId: GetActiveTableSessionByTableId,
    private getWaiterTables: GetWaiterTables,
    private getRestaurantTables: GetRestaurantTables,
    private createTable: CreateTable,
    private tableService: TableService
  ) { }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de uma mesa do restaurante a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: BodyTable,
  ): Promise<TableView> {
    const table = await this.createTable.handle({
      restaurantManagerId: req.user.id,
      tables: body.tables,
    });

    return { table: TableMapper.toHTTP({ ...table, tableSession: null }) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para receber a sessão ativa da mesa pelo id informado no parâmetro',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.CUSTOMER, ROLE.RESTAURANT))
  @Get('/:tableId/active-table-session')
  async getActiveTableSession(
    @Param() { tableId }: GetTableByIdDto,
  ): Promise<TableSessionViewPossibleNull> {
    const tableSession = await this.getActiveTableSessionByTableId.handle({
      tableId,
    });

    return {
      tableSession: tableSession
        ? TableSessionMapper.toHTTP(tableSession)
        : null,
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem de todas as mesas do restaurante com suas respectivas sessões a partir do gerente do restaurante logado ou todas as mesas que o garçom logado é responsável',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.WAITER, ROLE.RESTAURANT))
  @Get()
  async getTables(@Req() req: Request): Promise<TablesView> {
    let tables: TableWithIncludes[] = [];

    if (req.user.role === ROLE.WAITER) {
      const waiterId = req.user.id;

      tables = await this.getWaiterTables.handle({
        waiterId,
      });
    }

    if (req.user.role === ROLE.RESTAURANT) {
      const restaurantManagerId = req.user.id;

      tables = await this.getRestaurantTables.handle({
        restaurantManagerId,
      });
    }

    return {
      tables: tables.map(TableMapper.toHTTP),
    };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para marcar um garçom como responsável pela mesa a partir do id informado no parâmetro',
  })
  @ApiBody({ type: SingWaiterToTable })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Patch(':tableId/waiter')
  async senha(@Param('tableId') tableId: string, @Body() body: any): Promise<any> {
    return this.tableService.setWaiter(tableId, body);
  }
}
