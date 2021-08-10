import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbBrowserComponent } from './db-browser.component';

describe('DbBrowserComponent', () => {
  let component: DbBrowserComponent;
  let fixture: ComponentFixture<DbBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DbBrowserComponent ]
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
