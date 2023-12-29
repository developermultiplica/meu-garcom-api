/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';

import { PaginationQueryDto } from '~/helpers/dtos/pagination-query.dto';
import { ROLE } from '~/modules/auth/constants/role';
import { JwtAuthGuard } from '~/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '~/modules/auth/guards/role.guard';

import { CreateWaiterDto } from '../dtos/create-waiter.dto';
import { DeleteWaiterDto } from '../dtos/delete-waiter.dtos';
import { UpdateWaiterOnesignalIdDto, UpdateWaiterPasswordDto } from '../dtos/update-waiter-password.dto';
import { UpdateWaiterDto } from '../dtos/update-waiter.dto';
import { WaiterMapper } from '../mappers/waiter.mapper';
import { PaginatedWaitersView } from '../views/paginated-waiters.view';
import { WaiterView } from '../views/waiter.view';
import { WaiterService } from '../waiter.service';


@Controller('waiters')
@ApiTags('waiters')
export class WaiterController {
  constructor(private waiterService: WaiterService) { }

  @ApiOperation({
    summary:
      'Rota utilizada para criação de um garçom do restaurante a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateWaiterDto,
  ): Promise<WaiterView> {
    const waiter = await this.waiterService.create({
      ...body,
      restaurantManagerId: req.user.id,
    });

    return { waiter: WaiterMapper.toHTTP(waiter) };
  }

  @ApiOperation({
    summary:
      'Rota utilizada para listagem paginada de garçons a partir do gerente do restaurante logado',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @Get()
  async list(
    @Req() req: Request,
    @Query() { page }: PaginationQueryDto,
  ): Promise<PaginatedWaitersView> {
    const { waiters, matchCount, numberOfPages } =
      await this.waiterService.listByRestaurantManagerId(req.user.id, page);

    return {
      waiters: waiters.map(WaiterMapper.toHTTP),
      matchCount,
      numberOfPages,
    };
  }

  @ApiOperation({
    summary: 'Rota utilizada para atualização de um garçom. Senha não é opcional!',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @ApiBody({ type: UpdateWaiterDto })
  @Put(':waiterId')
  @Patch(':waiterId')
  async update(@Param('waiterId') waiterId: string, @Body() body: any): Promise<any> {
    return this.waiterService.update(waiterId, body);
  }

  @ApiOperation({
    summary: 'Rota utilizada para atualização da senha de um garçom',
  })
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @ApiBody({ type: UpdateWaiterPasswordDto })
  @Patch(':waiterId')
  async uptSenha(@Param('waiterId') waiterId: string, @Body() body: any): Promise<any> {
    return this.waiterService.uptSenha(waiterId, body);
  }

  @ApiOperation({
    summary: 'Rota utilizada para atualização do campo onesignal_id de um garçom',
  })
  @ApiBody({ type: UpdateWaiterOnesignalIdDto })
  @Patch(':waiterId/onesignal')
  async addOnesignal(@Param('waiterId') waiterId: string, @Body() body: any): Promise<any> {
    return this.waiterService.addOnesignal(waiterId, body);
  }

  @ApiOperation({
    summary:
      'Rota utilizada para exclusão de um garçom a partir do id informado no parâmetro',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, new RoleGuard(ROLE.RESTAURANT))
  @ApiBody({ type: DeleteWaiterDto })
  @Delete(':waiterId')
  async delete(@Param('waiterId') waiterId: string, @Body() body: any): Promise<void> {
    return this.waiterService.delete(waiterId, body);
  }
}
