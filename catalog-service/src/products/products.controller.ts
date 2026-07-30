import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AppLogger } from '../logging/app-logger.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly logger: AppLogger,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'List of products.', type: [Product] })
  findAll() {
    this.logger.info('Listing all products');
    return this.productsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product details by id' })
  @ApiResponse({ status: 200, description: 'Product details.', type: Product })
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.info('Fetching product', { productId: id });
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles('manager')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully.', type: Product })
  create(@Body() createProductDto: CreateProductDto) {
    this.logger.info('Creating product', { name: createProductDto.name });
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @Roles('manager')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.', type: Product })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.info('Updating product', { productId: id });
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles('manager')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.info('Deleting product', { productId: id });
    return this.productsService.remove(id);
  }
}
