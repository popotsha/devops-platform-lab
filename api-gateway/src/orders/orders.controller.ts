import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppLogger } from '../logging/app-logger.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './create-order.dto';
import { OrdersGatewayService } from './orders-gateway.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersGatewayService,
    private readonly logger: AppLogger,
  ) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Req() request: Request) {
    this.logger.info('Creating order ...');
    return this.ordersService.createOrder(dto, request);
  }

  @Get('mine')
  getMyOrders(@Req() request: Request) {
    this.logger.info('Listing my orders ...');
    return this.ordersService.getMyOrders(request);
  }

  @Get()
  @Roles('manager')
  getAllOrders(@Req() request: Request) {
    this.logger.info('Listing all orders ...');
    return this.ordersService.getAllOrders(request);
  }

  @Patch(':id/status')
  @Roles('manager')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: Request,
  ) {
    this.logger.info('Updating order status ...');
    return this.ordersService.updateOrderStatus(Number(id), dto, request);
  }
}
