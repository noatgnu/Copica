import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { DbScatterComponent } from './db-scatter.component';

describe('DbScatterComponent', () => {
  let component: DbScatterComponent;
  let fixture: ComponentFixture<DbScatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbScatterComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DbScatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
