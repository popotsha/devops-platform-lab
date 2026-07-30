import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsSummary } from '../models';
import { ProductsService } from '../products.service';
import { RoleAccessBannerComponent } from '../role-access-banner/role-access-banner.component';
import { BrowserLoggerService } from '../telemetry/browser-logger.service';
import { BrowserTraceService } from '../telemetry/browser-trace.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RoleAccessBannerComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly logger = inject(BrowserLoggerService);
  private readonly tracer = inject(BrowserTraceService);

  public isLoading = true;
  public loadError: string | null = null;
  public productCount = 0;
  public analytics: AnalyticsSummary | null = null;
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

  get inventoryValue(): number {
    return this.analytics?.inventoryValue ?? 0;
  }

  async ngOnInit() {
    if (!this.auth.isReady()) {
      await this.auth.initialize();
    }
  }

  private async refreshState(authenticated: boolean) {
    this.isLoading = true;
    this.loadError = null;
    this.analytics = null;
    this.productCount = 0;
    this.canManageProducts = false;

    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    this.canManageProducts = this.auth.getRoles().includes('manager');
    const profile = this.auth.userProfile();

    await this.tracer
      .run(
        'dashboard.load',
        async () => {
          this.logger.info('Loading dashboard for {username}', {
            event: 'dashboard.load',
            username: profile?.username ?? 'anonymous',
            role: this.canManageProducts ? 'manager' : 'customer',
          });

          if (this.canManageProducts) {
            await this.auth.ensureFreshToken();
            const [analytics, products] = await Promise.all([
              this.analyticsService.getSummary(),
              this.productsService.listProducts(),
            ]);
            this.analytics = analytics;
            this.productCount = products.length;
          }
        },
        {
          event: 'dashboard.load',
          username: profile?.username ?? 'anonymous',
          role: this.canManageProducts ? 'manager' : 'customer',
        },
      )
      .catch(() => {
        this.loadError = 'Failed to load dashboard statistics. Please try again.';
        this.logger.warn('Failed to load dashboard session', {
          event: 'dashboard.load.error',
        });
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
