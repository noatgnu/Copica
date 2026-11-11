import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProteomicRulerComponent } from './proteomic-ruler.component';

describe('ProteomicRulerComponent', () => {
  let component: ProteomicRulerComponent;
  let fixture: ComponentFixture<ProteomicRulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProteomicRulerComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProteomicRulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
