/**
 * planning.service.spec.ts — tests that prove exhaustMap semantics.
 *
 * WHAT THIS PROVES, and why it matters: the whole point of the planning
 * pipeline is "double-clicks fire ONE request". This test double-submits
 * and asserts exactly one HTTP request exists; only after that request is
 * flushed does a third submit produce a second request. If someone
 * "simplifies" exhaustMap to mergeMap, this test fails — which is the test
 * doing its job as a guardrail for the design decision.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlanningService } from './planning.service';

const input = {
  currentBalance: 10000,
  annualSalary: 100000,
  contributionRate: 0.1,
  employerMatchRate: 0.5,
  employerMatchCap: 0.03,
  annualReturnRate: 0.07,
  years: 1,
};

const result = {
  yearly: [],
  finalBalance: 24610,
  totalContributions: 10000,
  totalEmployerMatch: 3000,
  totalGrowth: 1610,
};

describe('PlanningService (exhaustMap)', () => {
  let service: PlanningService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlanningService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('ignores a second submit while the first is in flight', () => {
    service.submit(input);
    service.submit(input); // must be dropped, not queued, not run
    const req = httpMock.expectOne('/api/v1/projection');
    expect(req.request.method).toBe('POST');
    req.flush(result);
    expect(service.result()?.finalBalance).toBe(24610);
    expect(service.loading()).toBe(false);
  });

  it('accepts a new submit after the previous one completes', () => {
    service.submit(input);
    httpMock.expectOne('/api/v1/projection').flush(result);
    service.submit(input);
    const second = httpMock.expectOne('/api/v1/projection');
    second.flush(result);
    expect(service.result()?.finalBalance).toBe(24610);
  });
});
