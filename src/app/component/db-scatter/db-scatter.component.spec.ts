import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppModule } from '../../app.module';

import { DbScatterComponent } from './db-scatter.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DbScatterComponent', () => {
  let component: DbScatterComponent;
  let fixture: ComponentFixture<DbScatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AppModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DbScatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
