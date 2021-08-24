import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {DataFrame, IDataFrame} from "data-forge";

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  userDataSubject: BehaviorSubject<IDataFrame> = new BehaviorSubject<IDataFrame>(new DataFrame())
  dataObserver: Observable<IDataFrame> = this.userDataSubject.asObservable()
  constructor() { }

  updateData(data: IDataFrame) {
    this.userDataSubject.next(data)
    console.log(data)
  }
}
