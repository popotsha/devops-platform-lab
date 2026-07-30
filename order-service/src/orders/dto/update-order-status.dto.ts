export class UpdateOrderStatusDto {
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
}
