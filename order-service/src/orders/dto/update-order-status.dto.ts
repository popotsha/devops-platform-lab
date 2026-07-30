import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES, type OrderStatus } from './create-order.dto';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES, example: 'confirmed' })
  @IsIn(ORDER_STATUSES)
  status: OrderStatus;
}
