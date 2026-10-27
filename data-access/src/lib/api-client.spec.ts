/**
 * api-client.spec.ts — tests for the HTTP client.
 *
 * WHAT THIS PROVES: the client hits the right URLs with the right methods
 * and parameters. HttpTestingController intercepts requests in tests, so
 * no server is needed — the test asserts the REQUEST, then flushes a fake
 * response and asserts the parsed result.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  let client: ApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // fails the test if any request went unasserted
  });

  it('getAccounts requests the paged endpoint with params', () => {
    client.getAccounts(2, 5).subscribe((page) => {
      expect(page.page).toBe(2);
      expect(page.data).toHaveLength(1);
    });
    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/accounts' && r.params.get('page') === '2',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [{ id: 'acc-9', name: 'Test', type: 'cash', balance: 1 }],
      page: 2,
      pageSize: 5,
      total: 1,
      totalPages: 1,
    });
  });

  it('postProjection posts the input as JSON', () => {
    const input = {
      currentBalance: 0,
      annualSalary: 50000,
      contributionRate: 0.1,
      employerMatchRate: 0.5,
      employerMatchCap: 0.03,
      annualReturnRate: 0.05,
      years: 10,
    };
    client.postProjection(input).subscribe((result) => {
      expect(result.finalBalance).toBeGreaterThan(0);
    });
    const req = httpMock.expectOne('/api/v1/projection');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({
      yearly: [],
      finalBalance: 1,
      totalContributions: 0,
      totalEmployerMatch: 0,
      totalGrowth: 0,
    });
  });
});
