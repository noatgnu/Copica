import { Injectable } from '@angular/core';
import {UniprotResult} from "../class/uniprot-result";
import {HttpClient} from "@angular/common/http";
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {BehaviorSubject, Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UniprotService {
  private baseURL = 'https://www.uniprot.org/uploadlists/?';
  public Re = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/;

  private base = 'https://www.uniprot.org';
  private toolEndpoint = '/uploadlists/?';

  results: Map<string, any> = new Map<string, any>()

  constructor(private http: HttpClient) { }

  uniprotParseStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  uniprotParseStatusObserver: Observable<boolean> = this.uniprotParseStatus.asObservable()
  uniprotData: Subject<IDataFrame> = new Subject<IDataFrame>()
  uniprotResult: any[] = []
  run: number = 0
  getUniprot(uniprotUrl: string) {
    return this.http.get(uniprotUrl, {responseType: 'text', observe: 'response'});
  }

  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }

  UniProtParseGet(accList: string[], goStats: boolean) {
    const maxLength = accList.length;
    this.run = Math.floor(maxLength/300)
    if (this.run%300>0) {
      this.run = this.run + 1
    }
    let currentRun = 0
    for (let i = 0; i < maxLength; i += 300) {
      let l: string[];
      if (i + 300 < maxLength) {
        l = accList.slice(i, i + 300);
      } else {
        l = accList.slice(i);
      }
      const options: Map<string, string> = new Map<string, string>([
        ['from', 'ACC,ID'],
        ['to', 'ACC'],
        ['query', l.join('+OR+')],
        ['format', 'tab'],
        ['columns', 'id,entry name,reviewed,protein names,genes,organism,length,database(RefSeq),organism-id,go-id,go(cellular component),comment(SUBCELLULAR LOCATION),feature(TOPOLOGICAL_DOMAIN),feature(GLYCOSYLATION),comment(MASS SPECTROMETRY),mass,sequence'],
        ['compress', 'no'],
        ['force', 'no'],
        ['sort', 'score'],
        ['desc', ''],
        ['fil', '']
      ]);
      const uniprotUrl = this.baseURL + this.toParamString(options);
      this.getUniprot(uniprotUrl).subscribe((data) => {
        currentRun = currentRun + 1
        const df = fromCSV(<string>data.body);
        const columns = df.getColumnNames()
        const lastColumn = columns[columns.length -1]
        let new_df = df.withSeries("query", df.getSeries(lastColumn).bake()).bake()
        new_df = new_df.dropSeries(lastColumn).bake()
        for (const r of new_df) {
          r["Gene names"] = r["Gene names"].replaceAll(" ", ";").toUpperCase()
          this.results.set(r["query"], r)
        }
        console.log(currentRun)
        console.log(this.run)
        if (currentRun === this.run) {
          this.uniprotParseStatus.next(true)
        }
      });
    }
  }
}
