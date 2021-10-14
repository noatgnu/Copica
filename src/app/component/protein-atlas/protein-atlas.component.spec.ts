import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinAtlasComponent } from './protein-atlas.component';

describe('ProteinAtlasComponent', () => {
  let component: ProteinAtlasComponent;
  let fixture: ComponentFixture<ProteinAtlasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinAtlasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinAtlasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
