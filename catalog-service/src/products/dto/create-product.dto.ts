import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Coffee Mug', description: 'Product name' })
  name: string;

  @ApiProperty({ example: 'White ceramic coffee mug', required: false })
  description?: string;

  @ApiProperty({ example: 12.5, description: 'Product price in USD' })
  price: number;
}
