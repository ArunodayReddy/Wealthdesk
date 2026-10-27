/**
 * login.component.ts — the demo login page.
 *
 * WHERE IT IS USED: the /login route (public). On submit it calls
 * AuthService.login() and navigates to /dashboard. The route guard sends
 * unauthenticated users here.
 *
 * WHY A REACTIVE FORM: template-driven forms hide validation in the
 * template; reactive forms put the form MODEL in TypeScript, where it can
 * be unit-tested and where validation rules are explicit. For anything
 * beyond a single input, reactive is the professional default.
 *
 * TEACHING NOTE — FormGroup/FormControl: the form is an observable tree.
 * `form.valid` aggregates every control; `touched` tracks whether the user
 * visited a field, so error messages only appear after interaction (not
 * on first paint — showing errors before the user types is hostile UX).
 * Non-nullable controls (formBuilder.nonNullable) keep value types honest
 * under strict mode: no `string | null` surprises downstream.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@fidelity-portfolio-dashboard/data-access';

@Component({
  selector: 'wd-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Sign in to WealthDesk</h2>
      <p class="hint">
        Demo only — any email works. No password is checked and nothing is
        sent to a real identity provider.
      </p>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        @if (email.touched && email.invalid) {
          <p class="error">Enter a valid email address.</p>
        }
        <label>
          Password
          <input
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </label>
        @if (password.touched && password.invalid) {
          <p class="error">Password must be at least 8 characters.</p>
        }
        <button type="submit" [disabled]="form.invalid">Sign in</button>
      </form>
    </section>
  `,
  styles: [
    `
      .card {
        max-width: 420px;
        margin: 48px auto;
        background: #fff;
        border: 1px solid #e2e6ec;
        border-radius: 8px;
        padding: 24px;
      }
      label {
        display: block;
        margin-top: 16px;
        font-weight: 600;
      }
      input {
        display: block;
        width: 100%;
        margin-top: 6px;
        padding: 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
      }
      button {
        margin-top: 20px;
        padding: 10px 18px;
        border: 0;
        border-radius: 6px;
        background: #0b5fff;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .error {
        color: #b42318;
        font-size: 13px;
      }
      .hint {
        color: #5a6b84;
        font-size: 13px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.login(this.form.getRawValue().email);
    void this.router.navigate(['/dashboard']);
  }
}
