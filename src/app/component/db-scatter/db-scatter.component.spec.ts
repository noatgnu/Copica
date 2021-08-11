import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbScatterComponent } from './db-scatter.component';

describe('DbScatterComponent', () => {
  let component: DbScatterComponent;
  let fixture: ComponentFixture<DbScatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DbScatterComponent ]
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
