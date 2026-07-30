import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Catalog product id' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2, description: 'Units to purchase' })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
