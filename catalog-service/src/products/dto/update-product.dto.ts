import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Coffee Mug', description: 'Product name' })
  name?: string;

  @ApiPropertyOptional({ example: 'White ceramic coffee mug', description: 'Product description' })
  description?: string;

  @ApiPropertyOptional({ example: 12.5, description: 'Product price in USD' })
  price?: number;
}
