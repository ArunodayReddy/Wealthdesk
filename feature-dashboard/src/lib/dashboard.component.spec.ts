/**
 * dashboard.component.spec.ts — renders the dashboard from a mocked store.
 *
 * WHAT THIS PROVES: the smart container reads store signals and passes
 * plain values to dumb ui components — no HTTP, no real store. The mock
 * uses real signals for signal fields (so the constructor effect runs
 * against them) and jest.fn() for methods (so init calls are assertable).
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountsStore } from '@fidelity-portfolio-dashboard/data-access';
import { DashboardComponent } from './dashboard.component';

function createStoreMock() {
  return {
    accounts: signal([]),
    allHoldings: signal([]),
    selectedAccountId: signal(null),
    quotes: signal([]),
    loading: signal(false),
    error: signal(null),
    netWorth: () => 382361.5,
    selectedHoldings: () => [],
    allocation: () => [],
    loadAccounts: jest.fn(),
    refreshAllHoldings: jest.fn(),
    selectAccount: jest.fn(),
    setQuoteSymbols: jest.fn(),
  };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let store: ReturnType<typeof createStoreMock>;

  beforeEach(async () => {
    store = createStoreMock();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: AccountsStore, useValue: store }],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('loads accounts and starts quote polling on init', () => {
    expect(store.loadAccounts).toHaveBeenCalledTimes(1);
    expect(store.setQuoteSymbols).toHaveBeenCalledWith([
      'AAPL',
      'MSFT',
      'NVDA',
      'GOOGL',
      'AMZN',
    ]);
  });

  it('renders the heading and the formatted net worth', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Portfolio dashboard');
    expect(text).toContain('Net worth');
    expect(text).toContain('$382,361.50');
  });
});
