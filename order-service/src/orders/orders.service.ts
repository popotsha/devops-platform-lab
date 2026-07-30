import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserContext } from '../common/user-context';
import { CatalogClientService } from '../catalog/catalog-client.service';
import { OrderEventsPublisher } from '../messaging/order-events.publisher';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entities/order.entity';

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'shipped', 'cancelled']);

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly catalogClient: CatalogClientService,
    private readonly orderEventsPublisher: OrderEventsPublisher,
  ) {}

  async create(dto: CreateOrderDto, user: UserContext) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one order item is required');
    }

    const orders: Order[] = [];

    for (const item of dto.items) {
      if (!item.productId || item.quantity < 1) {
        throw new BadRequestException('Invalid order item');
      }

      const product = await this.catalogClient.getProduct(item.productId);

      orders.push(
        this.orderRepository.create({
          userSub: user.sub,
          userEmail: user.email,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          status: 'confirmed',
        }),
      );
    }

    const saved = await this.orderRepository.save(orders);
    await this.orderEventsPublisher.publishOrderCreated(saved);
    return saved;
  }

  findMine(user: UserContext) {
    return this.orderRepository.find({
      where: { userSub: user.sub },
      order: { createdAt: 'DESC' },
    });
  }

  findAll() {
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getStats() {
    const orders = await this.orderRepository.find();
    return {
      orderCount: orders.length,
      confirmedOrders: orders.filter((order) => order.status === 'confirmed').length,
    };
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    if (!ALLOWED_STATUSES.has(dto.status)) {
      throw new BadRequestException('Invalid order status');
    }

    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    order.status = dto.status;
    return this.orderRepository.save(order);
  }
}
