import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchSearchModalComponent } from './batch-search-modal.component';

describe('BatchSearchModalComponent', () => {
  let component: BatchSearchModalComponent;
  let fixture: ComponentFixture<BatchSearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BatchSearchModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
