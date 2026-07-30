import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-access-banner',
  standalone: true,
  templateUrl: './role-access-banner.component.html',
})
export class RoleAccessBannerComponent {
  @Input({ required: true }) roles: string[] = [];

  get primaryRole(): 'manager' | 'customer' | 'guest' {
    if (this.roles.includes('manager')) {
      return 'manager';
    }
    if (this.roles.includes('customer')) {
      return 'customer';
    }
    return 'guest';
  }

  get permissions(): string[] {
    if (this.primaryRole === 'manager') {
      return [
        'View inventory analytics (API-driven)',
        'Create, edit, and delete products',
        'Manage all orders',
        'Export catalog data',
        'Full operations console access',
      ];
    }

    if (this.primaryRole === 'customer') {
      return [
        'View read-only inventory list',
        'View your own orders',
        'View profile and role details',
      ];
    }

    return [];
  }
}
