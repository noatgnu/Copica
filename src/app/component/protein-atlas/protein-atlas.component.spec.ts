import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppModule } from '../../app.module';

import { ProteinAtlasComponent } from './protein-atlas.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ProteinAtlasComponent', () => {
  let component: ProteinAtlasComponent;
  let fixture: ComponentFixture<ProteinAtlasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AppModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
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
