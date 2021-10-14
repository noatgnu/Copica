import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {BehaviorSubject, Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";
import {HistoneItem} from "../class/histone-item";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  scatterData: string[] = []
  scatterFiles: string[] = []
  private _filters: any = {
    Kinases: "kinases.txt",
    Lrrk2: "lrrk2.txt",
    Phosphatases: "phosphatases.txt",
    PD: "pd.txt",
    PINK1: "pink1.txt",
    PDGWAS: "pd.gwas.txt"}
  filters: any = {}
  proteinAtlasURL: string = "https://www.proteinatlas.org/api/search_download.php?"
  defaultProteinAtlastColumns: string[] = ["g", "gs", "gd"]
  selected: string[] = []
  updateSelected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });
    return pArray.join('&');
  }

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

  getIndexText() {
    return this.http.get("assets/index.txt", {observe: "response", responseType: "text"})
  }

  getProteinAtlasColumnsMap(){
    return this.http.get("assets/proteinatlast.columns.map.txt", {observe: "response", responseType: "text"})
  }

  getDBjson(filename: string) {
    return this.http.get("assets/" + filename, {observe: "response"})
  }

  getDBtext(filename: string) {
    return this.http.get("assets/" + filename, {observe: "response", responseType: "text"})
  }

  getFilter() {
    for (const i in this._filters) {
      if (!(i in this.filters)) {
        this.filters[i] = []
      }
      this.http.get("assets/" + this._filters[i], {observe: "response", responseType: "text"}).subscribe(data => {
        const a = data.body?.split("\n")
        if (a) {
          for (const n of a) {
            if (n.trim() !== "") {
              this.filters[i].push(n.trim())
            }

          }
        }
      })
    }
  }

  getProteinAtlas(genes: string[], columns: string[]) {
    const d = this.defaultProteinAtlastColumns
    for (const c of columns) {
      d.push(c)
    }
    const options: Map<string, string> = new Map<string, string>([
      ["search", genes.join(",")],
      ["format", "json"],
      ["columns", d.join(",")],
      ["compress", "no"]
      ]
    )
    const url = this.proteinAtlasURL + this.toParamString(options)
    return this.http.get(url, {responseType: "json", observe: "response"})
  }
}
