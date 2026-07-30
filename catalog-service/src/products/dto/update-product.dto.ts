import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Coffee Mug', description: 'Product name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'White ceramic coffee mug', description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 12.5, description: 'Product price in USD' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;
}
