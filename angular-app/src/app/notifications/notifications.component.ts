import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { EmailNotification } from '../models';
import { NotificationsService } from '../notifications.service';
import { RoleAccessBannerComponent } from '../role-access-banner/role-access-banner.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RoleAccessBannerComponent],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  public isLoading = true;
  public loadError: string | null = null;
  public notifications: EmailNotification[] = [];
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
    this.notifications = [];
    this.canManageProducts = false;

    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    this.canManageProducts = this.auth.getRoles().includes('manager');

    if (!this.canManageProducts) {
      this.isLoading = false;
      await this.router.navigateByUrl('/dashboard');
      return;
    }

    try {
      await this.auth.ensureFreshToken();
      this.notifications = await this.notificationsService.getAll();
    } catch {
      this.loadError = 'Unable to load notifications. Please try again.';
      this.notifications = [];
    } finally {
      this.isLoading = false;
    }
  }
}
