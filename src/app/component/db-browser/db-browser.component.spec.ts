import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { DbBrowserComponent } from './db-browser.component';

describe('DbBrowserComponent', () => {
  let component: DbBrowserComponent;
  let fixture: ComponentFixture<DbBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbBrowserComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DbBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
