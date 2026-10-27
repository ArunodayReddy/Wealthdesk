/**
 * accounts.component.spec.ts — renders the accounts page from a mocked store.
 *
 * WHAT THIS PROVES: account selection and pagination drive store calls
 * (selectAccount, page.set + loadAccounts) instead of local state — the
 * page lives in the store, so the pager is a view over shared state.
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountsStore } from '@fidelity-portfolio-dashboard/data-access';
import { AccountsComponent } from './accounts.component';

function createStoreMock() {
  return {
    accounts: signal([
      { id: 'acc-1', name: 'Everyday Brokerage', type: 'brokerage', balance: 84320.5 },
      { id: 'acc-2', name: 'Rollover IRA', type: 'retirement', balance: 142870.25 },
    ]),
    selectedAccountId: signal<string | null>(null),
    selectedHoldings: () => [],
    page: signal(1),
    pageSize: signal(20),
    totalPages: signal(2),
    loading: signal(false),
    error: signal(null),
    loadAccounts: jest.fn(),
    selectAccount: jest.fn(),
  };
}

describe('AccountsComponent', () => {
  let fixture: ComponentFixture<AccountsComponent>;
  let store: ReturnType<typeof createStoreMock>;

  beforeEach(async () => {
    store = createStoreMock();
    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [{ provide: AccountsStore, useValue: store }],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();
  });

  it('renders the accounts and the pager', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Everyday Brokerage');
    expect(text).toContain('Rollover IRA');
    expect(text).toContain('Page 1 of 2');
  });

  it('selects an account on click', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button.account');
    buttons[0].click();
    expect(store.selectAccount).toHaveBeenCalledWith('acc-1');
  });

  it('advances the page and reloads', () => {
    const next = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLElement).textContent?.trim() === 'Next') as HTMLButtonElement;
    next.click();
    expect(store.page()).toBe(2);
    expect(store.loadAccounts).toHaveBeenCalledTimes(2); // init + page change
  });
});
