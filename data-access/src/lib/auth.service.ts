/**
 * auth.service.ts — demo authentication state.
 *
 * WHERE IT IS USED: the login component calls login(); the route guard
 * reads isAuthenticated(); the auth interceptor reads token().
 *
 * WHY IT IS DEMO-ONLY, STATED PLAINLY: there is no real identity provider
 * here. login() accepts any email and stores a localStorage token — it
 * proves the GUARD and INTERCEPTOR patterns, not a security model. A real
 * app would trade credentials for a server-issued JWT with expiry and
 * refresh. Never describe this as "auth" in an interview without the word
 * "demo" attached.
 *
 * TEACHING NOTE — signals for state: isAuthenticated is a signal, so any
 * component or guard reading it re-evaluates automatically when login or
 * logout runs. No BehaviorSubject, no manual subscription, no stale reads.
 * The localStorage guard (typeof check) keeps this safe under SSR, where
 * localStorage does not exist.
 */
import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'wealthdesk-demo-token';
const USER_KEY = 'wealthdesk-demo-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal<boolean>(this.hasStoredToken());
  readonly currentUser = signal<string | null>(this.readStoredUser());

  private hasStoredToken(): boolean {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(TOKEN_KEY) !== null
    );
  }

  private readStoredUser(): string | null {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(USER_KEY)
      : null;
  }

  /** Demo login: any email works. Stores a fake token + the email. */
  login(email: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, `demo-${email}`);
      localStorage.setItem(USER_KEY, email);
    }
    this.currentUser.set(email);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /** Token for the auth interceptor. Null when logged out. */
  token(): string | null {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  }
}
