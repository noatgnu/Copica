import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppModule } from '../../app.module';

import { ProteomicRulerComponent } from './proteomic-ruler.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ProteomicRulerComponent', () => {
  let component: ProteomicRulerComponent;
  let fixture: ComponentFixture<ProteomicRulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AppModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicRulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
