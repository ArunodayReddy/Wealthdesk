/**
 * app.spec.ts — the web shell renders auth-dependent chrome.
 *
 * WHAT THIS PROVES: the shell shows "Sign in" when logged out and the
 * user email + "Sign out" when logged in, and sign-out calls
 * AuthService.logout. The router is real (provideRouter) with a dummy
 * /login route so the post-logout navigation resolves instead of
 * rejecting on an unmatched URL.
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '@fidelity-portfolio-dashboard/data-access';
import { App } from './app';

@Component({ standalone: true, template: '' })
class BlankComponent {}

describe('App shell', () => {
  async function setup(authenticated: boolean) {
    const auth = {
      isAuthenticated: signal(authenticated),
      currentUser: signal(
        authenticated ? 'demo@wealthdesk.local' : null,
      ),
      logout: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'login', component: BlankComponent },
        ]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, auth };
  }

  it('shows Sign in when logged out', async () => {
    const { fixture } = await setup(false);
    expect(fixture.nativeElement.textContent).toContain('Sign in');
  });

  it('shows the user and signs out when logged in', async () => {
    const { fixture, auth } = await setup(true);
    expect(fixture.nativeElement.textContent).toContain(
      'demo@wealthdesk.local',
    );
    const signOut = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find(
      (b) => (b as HTMLElement).textContent?.trim() === 'Sign out',
    ) as HTMLButtonElement;
    signOut.click();
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});
