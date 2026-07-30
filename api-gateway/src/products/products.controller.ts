import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppLogger } from '../logging/app-logger.service';
import { ProductsGatewayService } from './products-gateway.service';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsGatewayService,
    private readonly logger: AppLogger,
  ) {}

  @Public()
  @Get()
  getProducts() {
    this.logger.info('Listing all products ...');
    return this.productsService.getProducts();
  }

  @Public()
  @Get(':id')
  getProduct(@Param('id') id: string) {
    this.logger.info('Fetching product ...');
    return this.productsService.getProduct(Number(id));
  }

  @Post()
  @Roles('manager')
  createProduct(@Body() dto: CreateProductDto, @Req() request: Request) {
    this.logger.info('Creating product ...');
    return this.productsService.createProduct(dto, request);
  }

  @Patch(':id')
  @Roles('manager')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() request: Request,
  ) {
    this.logger.info('Updating product ...');
    return this.productsService.updateProduct(Number(id), dto, request);
  }

  @Delete(':id')
  @Roles('manager')
  deleteProduct(@Param('id') id: string, @Req() request: Request) {
    this.logger.info('Deleting product ...');
    return this.productsService.deleteProduct(Number(id), request);
  }
}
