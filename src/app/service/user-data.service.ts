import { Injectable, signal } from '@angular/core';
import { DataFrame, IDataFrame } from "data-forge";

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  readonly data = signal<IDataFrame>(new DataFrame());

  updateData(data: IDataFrame) {
    this.data.set(data);
  }
}
