import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppModule } from '../../app.module';

import { DbBrowserComponent } from './db-browser.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DbBrowserComponent', () => {
  let component: DbBrowserComponent;
  let fixture: ComponentFixture<DbBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AppModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DbBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
