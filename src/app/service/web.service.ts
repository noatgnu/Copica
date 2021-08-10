import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";
import {HistoneItem} from "../class/histone-item";

@Injectable({
  providedIn: 'root'
})
export class WebService {

  constructor(private http: HttpClient) { }

  getOrganisms() : Observable<HistoneItem[]> {
    return this.http.get<HistoneItem[]>("assets/organisms.json", {observe: "body"})
  }

  getExampleInput() {
    return this.http.get("assets/proteinGroups.txt", {observe: "response", responseType: "text"})
  }

  getIndex() {
    return this.http.get("assets/index.json", {observe: "response"})
  }

  getDBjson(filename: string) {
    return this.http.get("assets/" + filename, {observe: "response"})
  }
}
