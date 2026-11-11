import { Component, inject, signal } from '@angular/core';
import { fromCSV } from "data-forge";
import { NgbAccordionDirective, NgbAccordionItem, NgbAccordionHeader, NgbAccordionButton, NgbAccordionCollapse, NgbAccordionBody } from '@ng-bootstrap/ng-bootstrap/accordion';
import { DatatableComponent, DataTableColumnDirective, DataTableColumnHeaderDirective, DataTableColumnCellDirective } from '@swimlane/ngx-datatable';
import { WebService } from "../../service/web.service";
import { SettingsService } from "../../service/settings.service";

@Component({
  selector: 'app-dataset-settings',
  templateUrl: './dataset-settings.component.html',
  styleUrls: ['./dataset-settings.component.css'],
  imports: [NgbAccordionDirective, NgbAccordionItem, NgbAccordionHeader, NgbAccordionButton, NgbAccordionCollapse, NgbAccordionBody, DatatableComponent, DataTableColumnDirective, DataTableColumnHeaderDirective, DataTableColumnCellDirective]
})
export class DatasetSettingsComponent {
  private web = inject(WebService);
  private settings = inject(SettingsService);
  readonly loaded = signal(false);
  readonly datasetsSettings = signal<Record<string, boolean>>({});
  readonly rows = signal<any[]>([]);
  readonly enabled = signal(0);
  readonly columns = [
    {name: "Cell type", prop: "Cell type"}, {prop: "Experiment type"}, {prop: "Organisms"}, {prop: "Condition"}, {prop: "Fraction"}
  ];

  constructor() {
    this.web.getIndexText().subscribe(data => {
      const indexData = fromCSV(<string>data.body);
      const settings: Record<string, boolean> = this.settings.getDatasetSettings();
      for (const r of indexData) {
        if (!(r["File"] in settings)) {
          settings[r["File"]] = true;
        }
      }
      this.datasetsSettings.set(settings);
      this.settings.setDatasetSettings(settings);
      this.enabled.set(this.countEnabled(settings));
      this.rows.set(indexData.toArray());
      this.loaded.set(true);
    });
  }

  private countEnabled(settings: Record<string, boolean>) {
    return Object.values(settings).filter(v => v).length;
  }

  toggleDatasets(e: Event, file: string) {
    e.stopPropagation();
    this.datasetsSettings.update(s => ({...s, [file]: !s[file]}));
  }

  saveSettings(e: Event) {
    e.stopPropagation();
    this.settings.setDatasetSettings(this.datasetsSettings());
    this.enabled.set(this.countEnabled(this.datasetsSettings()));
  }

  clearSettings(e: Event) {
    e.stopPropagation();
    this.selectAll(e);
    this.saveSettings(e);
  }

  selectAll(e: Event) {
    e.stopPropagation();
    this.datasetsSettings.update(s => Object.fromEntries(Object.keys(s).map(k => [k, true])));
  }
}
