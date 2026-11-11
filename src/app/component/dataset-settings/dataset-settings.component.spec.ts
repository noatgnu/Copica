import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { DatasetSettingsComponent } from './dataset-settings.component';

describe('DatasetSettingsComponent', () => {
  let component: DatasetSettingsComponent;
  let fixture: ComponentFixture<DatasetSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetSettingsComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DatasetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
