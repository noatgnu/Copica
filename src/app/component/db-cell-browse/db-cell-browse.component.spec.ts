import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbCellBrowseComponent } from './db-cell-browse.component';

describe('DbCellBrowseComponent', () => {
  let component: DbCellBrowseComponent;
  let fixture: ComponentFixture<DbCellBrowseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DbCellBrowseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DbCellBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
