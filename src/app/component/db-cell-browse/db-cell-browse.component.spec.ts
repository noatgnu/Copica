import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { DbCellBrowseComponent } from './db-cell-browse.component';

describe('DbCellBrowseComponent', () => {
  let component: DbCellBrowseComponent;
  let fixture: ComponentFixture<DbCellBrowseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbCellBrowseComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DbCellBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
