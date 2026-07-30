import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-header.component.html',
})
export class DashboardHeaderComponent {
  readonly auth = inject(AuthService);
  readonly host = inject(ElementRef<HTMLElement>);

  menuOpen = false;

  readonly storefrontUrl =
    (typeof window !== 'undefined' &&
      (window as Window & { __ENV?: { storefrontUrl?: string } }).__ENV?.storefrontUrl) ||
    'http://localhost:3000';

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.closeMenu();
    void this.auth.logout();
  }

  login(): void {
    void this.auth.login();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
