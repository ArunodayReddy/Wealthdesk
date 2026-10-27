/**
 * login.component.spec.ts — the login form's validation and submit wiring.
 *
 * WHAT THIS PROVES: an invalid form never calls AuthService.login (the
 * guard against submitting bad data lives in the component, not in the
 * template's disabled button — disabled buttons can be bypassed); a
 * valid form logs in and navigates to /dashboard.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@fidelity-portfolio-dashboard/data-access';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: { login: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    auth = { login: jest.fn() };
    router = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('does not log in with an invalid form', () => {
    fixture.componentInstance.form.setValue({
      email: 'not-an-email',
      password: 'short',
    });
    fixture.componentInstance.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('logs in and navigates with a valid form', () => {
    fixture.componentInstance.form.setValue({
      email: 'demo@wealthdesk.local',
      password: 'demo-password',
    });
    fixture.componentInstance.onSubmit();
    expect(auth.login).toHaveBeenCalledWith('demo@wealthdesk.local');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
