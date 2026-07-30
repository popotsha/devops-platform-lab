import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Order } from '../models';
import { OrdersService } from '../orders.service';
import { RoleAccessBannerComponent } from '../role-access-banner/role-access-banner.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RoleAccessBannerComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly ordersService = inject(OrdersService);

  public isLoading = true;
  public loadError: string | null = null;
  public orders: Order[] = [];
  public canManageProducts = false;

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      void this.refreshState(this.auth.isAuthenticated());
    });
  }

  get userRoles(): string[] {
    return this.auth.userProfile()?.roles ?? [];
  }

  async ngOnInit() {
    if (!this.auth.isReady()) {
      await this.auth.initialize();
    }
  }

  private async refreshState(authenticated: boolean) {
    this.isLoading = true;
    this.loadError = null;
    this.orders = [];
    this.canManageProducts = false;

    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    this.canManageProducts = this.auth.getRoles().includes('manager');

    try {
      await this.auth.ensureFreshToken();
      this.orders = this.canManageProducts
        ? await this.ordersService.getAllOrders()
        : await this.ordersService.getMyOrders();
    } catch {
      this.loadError = 'Unable to load orders. Please try again.';
      this.orders = [];
    } finally {
      this.isLoading = false;
    }
  }
}
