import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UniprotService } from './uniprot.service';

describe('UniprotService', () => {
  let service: UniprotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(UniprotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
