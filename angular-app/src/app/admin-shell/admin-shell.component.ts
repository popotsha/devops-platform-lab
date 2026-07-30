import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';

type NavItem = {
  id: string;
  label: string;
  path: string;
  hint: string;
  managerOnly?: boolean;
};

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DashboardHeaderComponent],
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  sidebarOpen = true;
  pageTitle = 'Dashboard';
  private navSub?: Subscription;

  readonly storefrontUrl =
    (typeof window !== 'undefined' &&
      (window as Window & { __ENV?: { storefrontUrl?: string } }).__ENV?.storefrontUrl) ||
    'http://localhost:3000';

  private readonly navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', hint: 'Statistics' },
    { id: 'products', label: 'Products', path: '/products', hint: 'Inventory' },
    { id: 'orders', label: 'Orders', path: '/orders', hint: 'Order history' },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      hint: 'Email delivery',
      managerOnly: true,
    },
    { id: 'profile', label: 'Profile', path: '/profile', hint: 'Account details' },
  ];

  private readonly titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/orders': 'Orders',
    '/notifications': 'Notifications',
    '/profile': 'Profile',
  };

  get isManager(): boolean {
    return this.auth.getRoles().includes('manager');
  }

  get visibleNavItems(): NavItem[] {
    return this.navItems
      .filter((item) => !item.managerOnly || this.isManager)
      .map((item) => {
        if (item.id === 'products') {
          return {
            ...item,
            hint: this.isManager ? 'Manage catalog' : 'Read-only inventory',
          };
        }
        return item;
      });
  }

  async ngOnInit() {
    if (!this.auth.isReady()) {
      await this.auth.initialize();
    }

    this.sidebarOpen = !this.isMobileNav();
    this.updatePageTitle(this.router.url);

    this.navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updatePageTitle(event.urlAfterRedirects);
        if (this.isMobileNav()) {
          this.sidebarOpen = false;
        }
      });

    if (typeof window !== 'undefined') {
      window.matchMedia('(max-width: 960px)').addEventListener('change', this.onViewportChange);
    }
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    if (typeof window !== 'undefined') {
      window.matchMedia('(max-width: 960px)').removeEventListener('change', this.onViewportChange);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarIfMobile(): void {
    if (this.isMobileNav()) {
      this.sidebarOpen = false;
    }
  }

  navIcon(id: string): string {
    if (id === 'notifications') {
      return 'N';
    }
    return id.slice(0, 1).toUpperCase();
  }

  private onViewportChange = (event: MediaQueryListEvent): void => {
    this.sidebarOpen = !event.matches;
  };

  private isMobileNav(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches;
  }

  private updatePageTitle(url: string): void {
    const path = url.split('?')[0];
    if (path.startsWith('/orders')) {
      this.pageTitle = 'Orders';
      return;
    }
    this.pageTitle = this.titles[path] ?? 'Admin Console';
  }
}
