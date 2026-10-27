/**
 * watchlist.component.spec.ts — renders the watchlist page from mocked
 * services.
 *
 * WHAT THIS PROVES: the component is thin wiring — search input events
 * reach the service, items render from the service signal, and the
 * constructor effect keeps the store's quote poller tracking the items.
 */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AccountsStore,
  WatchlistService,
} from '@fidelity-portfolio-dashboard/data-access';
import { WatchlistComponent } from './watchlist.component';

function createWatchlistMock() {
  return {
    items: signal([{ symbol: 'AAPL' }]),
    searchResults: signal([]),
    searching: signal(false),
    search: jest.fn(),
    refresh: jest.fn(),
    queueAdd: jest.fn(),
    remove: jest.fn(),
  };
}

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;
  let watchlist: ReturnType<typeof createWatchlistMock>;
  let store: { quotes: ReturnType<typeof signal>; setQuoteSymbols: jest.Mock };

  beforeEach(async () => {
    watchlist = createWatchlistMock();
    store = { quotes: signal([]), setQuoteSymbols: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [WatchlistComponent],
      providers: [
        { provide: WatchlistService, useValue: watchlist },
        { provide: AccountsStore, useValue: store },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WatchlistComponent);
    fixture.detectChanges();
  });

  it('refreshes on init and polls the item symbols', () => {
    expect(watchlist.refresh).toHaveBeenCalledTimes(1);
    expect(store.setQuoteSymbols).toHaveBeenCalledWith(['AAPL']);
  });

  it('renders the items', () => {
    expect(fixture.nativeElement.textContent).toContain('AAPL');
  });

  it('forwards search input to the service', () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    input.value = 'MSF';
    input.dispatchEvent(new Event('input'));
    expect(watchlist.search).toHaveBeenCalledWith('MSF');
  });
});
