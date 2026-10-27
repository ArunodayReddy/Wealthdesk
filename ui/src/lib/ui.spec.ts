/**
 * ui.spec.ts — component tests for the dumb components.
 *
 * WHAT THIS PROVES: presentational components render their inputs and
 * nothing else. TestBed renders the component with fixture inputs and
 * asserts on the DOM text — no HTTP, no router, no store. If a component
 * test ever needs a mock service, the component has stopped being dumb
 * and the test is telling you to refactor.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';
import { HoldingTableComponent } from './holding-table.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('label', 'Net worth');
    fixture.componentRef.setInput('value', '$382,361.50');
    fixture.detectChanges();
  });

  it('renders the label and value', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Net worth');
    expect(text).toContain('$382,361.50');
  });
});

describe('HoldingTableComponent', () => {
  it('renders one row per holding and the empty state', async () => {
    await TestBed.configureTestingModule({
      imports: [HoldingTableComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(HoldingTableComponent);
    fixture.componentRef.setInput('holdings', [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        shares: 10,
        avgCost: 100,
        currentPrice: 150,
        accountId: 'acc-1',
      },
    ]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('AAPL');

    fixture.componentRef.setInput('holdings', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No holdings');
  });
});
