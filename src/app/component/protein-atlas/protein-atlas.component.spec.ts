import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProteinAtlasComponent } from './protein-atlas.component';

describe('ProteinAtlasComponent', () => {
  let component: ProteinAtlasComponent;
  let fixture: ComponentFixture<ProteinAtlasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProteinAtlasComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProteinAtlasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
