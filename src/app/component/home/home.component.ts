import { Component, inject, signal } from '@angular/core';
import { fromCSV } from "data-forge";
import { WebService } from "../../service/web.service";
import { BasicSearchComponent } from '../basic-search/basic-search.component';
import { RandomChartComponent } from '../random-chart/random-chart.component';
import { DatasetSettingsComponent } from '../dataset-settings/dataset-settings.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [BasicSearchComponent, RandomChartComponent, DatasetSettingsComponent]
})
export class HomeComponent {
  private web = inject(WebService);
  readonly datasetCount = signal<number | undefined>(undefined);

  constructor() {
    this.web.getIndexText().subscribe(data => {
      this.datasetCount.set(fromCSV(<string>data.body).count());
    });
  }
}
