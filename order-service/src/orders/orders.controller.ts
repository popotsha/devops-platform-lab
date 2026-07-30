import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { getUserContext } from '../common/user-context';
import { AppLogger } from '../logging/app-logger.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Internal analytics endpoint used by catalog-service.
   * Intended for Docker-network callers only (not exposed via the API gateway).
   */
  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Order counts for analytics (internal)' })
  getStats() {
    return this.ordersService.getStats();
  }

  @Post()
  @ApiOperation({ summary: 'Create order items for the current user' })
  create(@Body() dto: CreateOrderDto, @Req() request: Request) {
    this.logger.info('Creating order', { itemCount: dto.items.length });
    return this.ordersService.create(dto, getUserContext(request));
  }

  @Get('mine')
  @ApiOperation({ summary: 'List orders for the current user' })
  findMine(@Req() request: Request) {
    this.logger.info('Listing my orders');
    return this.ordersService.findMine(getUserContext(request));
  }

  @Get()
  @Roles('manager')
  @ApiOperation({ summary: 'List all orders (manager view)' })
  findAll() {
    this.logger.info('Listing all orders');
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @Roles('manager')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    this.logger.info('Updating order status', { orderId: id, status: dto.status });
    return this.ordersService.updateStatus(id, dto);
  }
}
