import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicRulerComponent } from './proteomic-ruler.component';

describe('ProteomicRulerComponent', () => {
  let component: ProteomicRulerComponent;
  let fixture: ComponentFixture<ProteomicRulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteomicRulerComponent ]
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
