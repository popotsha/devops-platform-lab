import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCacheService } from '../cache/product-cache.service';
import { ResponseCacheService } from '../cache/response-cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

const SEED_PRODUCTS: CreateProductDto[] = [
  {
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling over-ear headphones',
    price: 199.99,
  },
  {
    name: 'Smart Watch',
    description: 'Fitness tracking with heart-rate monitor',
    price: 249.5,
  },
  {
    name: 'USB-C Hub',
    description: '7-in-1 adapter for modern laptops',
    price: 49.99,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact wireless keyboard with RGB backlight',
    price: 89.99,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productCache: ProductCacheService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  async onModuleInit() {
    const count = await this.productRepository.count();
    if (count === 0) {
      await this.productRepository.save(
        SEED_PRODUCTS.map((product) => this.productRepository.create(product)),
      );
    }
  }

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create(createProductDto);
    const saved = await this.productRepository.save(product);
    await this.productCache.invalidateAll();
    await this.responseCache.invalidate('analytics:summary');
    return saved;
  }

  async findAll() {
    const cached = await this.productCache.getAll();
    if (cached) {
      return cached;
    }

    const products = await this.productRepository.find({ order: { id: 'ASC' } });
    await this.productCache.setAll(products);
    return products;
  }

  async findOne(id: number) {
    const cached = await this.productCache.getOne(id);
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productCache.setOne(product);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOneFromDb(id);
    Object.assign(product, updateProductDto);
    const saved = await this.productRepository.save(product);
    await this.productCache.invalidateOne(id);
    await this.responseCache.invalidate('analytics:summary');
    return saved;
  }

  async remove(id: number) {
    const product = await this.findOneFromDb(id);
    const removed = await this.productRepository.remove(product);
    await this.productCache.invalidateOne(id);
    await this.responseCache.invalidate('analytics:summary');
    return removed;
  }

  private async findOneFromDb(id: number) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }
}
