import { Injectable, effect, inject, signal } from '@angular/core';
import {
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
  ReadyArgs,
  typeEventArgs,
} from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { UserProfileView } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(Keycloak);
  private readonly keycloakEvents = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly logoutSignalKey = 'ms-kit-sso-logout';

  readonly isAuthenticated = signal(false);
  readonly userProfile = signal<UserProfileView | null>(null);
  readonly isReady = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.logoutSignalKey && this.isAuthenticated()) {
          this.applyLocalLogout();
        }
      });
    }

    effect(() => {
      const event = this.keycloakEvents();

      if (event.type === KeycloakEventType.Ready) {
        const authenticated = typeEventArgs<ReadyArgs>(event.args);
        if (authenticated) {
          void this.syncFromKeycloak();
        } else {
          this.isAuthenticated.set(false);
          this.userProfile.set(null);
        }
        this.isReady.set(true);
      }

      if (event.type === KeycloakEventType.AuthSuccess) {
        void this.syncFromKeycloak();
        this.isReady.set(true);
      }

      if (event.type === KeycloakEventType.AuthRefreshSuccess) {
        void this.syncFromKeycloak();
      }

      if (event.type === KeycloakEventType.AuthLogout) {
        this.isAuthenticated.set(false);
        this.userProfile.set(null);
      }
    });
  }

  async initialize(): Promise<void> {
    this.handlePostLogoutRedirect();
    this.registerSessionWatchdog();

    if (this.keycloak.authenticated) {
      await this.syncFromKeycloak();
    }

    this.isReady.set(true);
  }

  getAccessToken(): string | undefined {
    return this.keycloak.token ?? undefined;
  }

  getRoles(): string[] {
    const tokenParsed = this.keycloak.tokenParsed as
      | { realm_access?: { roles?: string[] } }
      | undefined;

    return tokenParsed?.realm_access?.roles ?? [];
  }

  displayName(): string {
    const profile = this.userProfile();
    if (!profile) {
      return 'User';
    }

    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    return fullName || profile.username;
  }

  async login(): Promise<void> {
    await this.keycloak.login({ redirectUri: window.location.origin });
  }

  async logout(): Promise<void> {
    this.clearBrowserStorage();
    this.isAuthenticated.set(false);
    this.userProfile.set(null);

    try {
      localStorage.setItem(this.logoutSignalKey, String(Date.now()));
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }

    const redirectUri = `${window.location.origin}/dashboard?loggedOut=1`;

    try {
      await this.keycloak.logout({ redirectUri });
    } catch {
      window.location.href = redirectUri;
    }
  }

  async ensureFreshToken(minValidity = 30): Promise<string | undefined> {
    if (!this.keycloak.authenticated) {
      return undefined;
    }

    try {
      await this.keycloak.updateToken(minValidity);
    } catch {
      return undefined;
    }

    return this.keycloak.token ?? undefined;
  }

  async syncFromKeycloak(): Promise<void> {
    if (!this.keycloak.authenticated) {
      this.isAuthenticated.set(false);
      this.userProfile.set(null);
      return;
    }

    const profile = await this.keycloak.loadUserProfile();
    const roles = this.getRoles();

    this.userProfile.set({
      username: profile.username ?? 'user',
      email: profile.email ?? 'N/A',
      firstName: profile.firstName ?? 'N/A',
      lastName: profile.lastName ?? 'N/A',
      roles,
    });
    this.isAuthenticated.set(true);
  }

  private applyLocalLogout(): void {
    this.keycloak.clearToken();
    this.isAuthenticated.set(false);
    this.userProfile.set(null);
  }

  private registerSessionWatchdog(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !this.keycloak.authenticated) {
        return;
      }

      void this.keycloak.updateToken(0).catch(() => this.applyLocalLogout());
    });
  }

  private handlePostLogoutRedirect(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('loggedOut') !== '1') {
      return;
    }

    this.clearBrowserStorage();
    params.delete('loggedOut');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  private clearBrowserStorage(): void {
    sessionStorage.clear();
    localStorage.clear();

    if (typeof indexedDB !== 'undefined') {
      void indexedDB.databases?.().then((databases) => {
        for (const database of databases ?? []) {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
          }
        }
      });
    }
  }
}
