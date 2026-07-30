import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { BrowserLoggerService } from '../telemetry/browser-logger.service';
import { BrowserTraceService } from '../telemetry/browser-trace.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly logger = inject(BrowserLoggerService);
  private readonly tracer = inject(BrowserTraceService);

  async ngOnInit() {
    if (!this.auth.isReady()) {
      await this.auth.initialize();
    }

    if (!this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/dashboard');
      return;
    }

    const profile = this.auth.userProfile();
    await this.tracer.run(
      'profile.view',
      async () => {
        this.logger.info('Viewing profile for {username}', {
          event: 'profile.view',
          username: profile?.username ?? 'user',
        });
      },
      {
        event: 'profile.view',
        username: profile?.username ?? 'user',
      },
    );
  }
}
