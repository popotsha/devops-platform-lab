import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Coffee Mug', description: 'Product name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'White ceramic coffee mug' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 12.5, description: 'Product price in USD' })
  @IsNumber()
  @IsPositive()
  price: number;
}
