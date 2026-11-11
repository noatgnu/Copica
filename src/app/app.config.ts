import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withXhr()),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(PlotlyModule.forRoot(PlotlyJS)),
  ],
};
