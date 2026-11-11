import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UniprotService } from './uniprot.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('UniprotService', () => {
  let service: UniprotService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(UniprotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
