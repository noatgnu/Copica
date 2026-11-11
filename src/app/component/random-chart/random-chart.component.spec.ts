import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { RandomChartComponent } from './random-chart.component';

describe('RandomChartComponent', () => {
  let component: RandomChartComponent;
  let fixture: ComponentFixture<RandomChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomChartComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(RandomChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
