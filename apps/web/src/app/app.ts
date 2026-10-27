/**
 * app.ts — the WealthDesk shell (root component).
 *
 * WHERE IT IS USED: bootstrapped by main.ts. It owns the header, the nav,
 * and the router outlet — nothing else. Every page is a lazy-loaded
 * feature; the shell never imports feature components directly, only
 * through the router.
 *
 * WHY THE SHELL IS THIN: if the shell fetched data or held state, every
 * route change would tangle with it. Navigation state lives in the router;
 * domain state lives in stores; the shell just renders chrome.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@fidelity-portfolio-dashboard/data-access';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="shell-header">
      <a class="brand" routerLink="/dashboard">WealthDesk</a>
      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/accounts" routerLinkActive="active">Accounts</a>
        <a routerLink="/planning" routerLinkActive="active">Planning</a>
        <a routerLink="/watchlist" routerLinkActive="active">Watchlist</a>
      </nav>
      <div class="user">
        @if (auth.isAuthenticated()) {
          <span>{{ auth.currentUser() }}</span>
          <button (click)="logout()">Sign out</button>
        } @else {
          <a routerLink="/login">Sign in</a>
        }
      </div>
    </header>
    <main class="shell-main">
      <router-outlet />
    </main>
    <footer class="shell-footer">
      WealthDesk is an independent concept project. All market data is
      simulated mock data — not real quotes, not affiliated with any
      brokerage.
    </footer>
  `,
  styles: [
    `
      .shell-header {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 14px 24px;
        background: #0f2040;
        color: #fff;
      }
      .brand {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        text-decoration: none;
      }
      .nav {
        display: flex;
        gap: 16px;
      }
      .nav a {
        color: #cbd5e1;
        text-decoration: none;
      }
      .nav a.active {
        color: #fff;
        font-weight: 700;
      }
      .user {
        margin-left: auto;
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .user a,
      .user button {
        color: #fff;
        background: transparent;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        text-decoration: none;
      }
      .shell-main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px;
      }
      .shell-footer {
        text-align: center;
        color: #5a6b84;
        font-size: 12px;
        padding: 24px;
      }
    `,
  ],
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
