import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly datasetSettingsVersion = signal(0);

  getDatasetSettings() {
    const s = localStorage.getItem("datasets");
    if (s) {
      return JSON.parse(s);
    }
    return {};
  }

  setDatasetSettings(datasetSettings: any) {
    localStorage.setItem("datasets", JSON.stringify(datasetSettings));
    this.datasetSettingsVersion.update(v => v + 1);
  }
}
