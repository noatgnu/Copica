import {DataFrame, fromJSON, fromObject} from "data-forge";
import {WebService} from "../service/web.service";

export class HistoneDb {
  //df: DataFrame;

  constructor(private http: WebService) {
  }

  getHistones() {
    this.http.getOrganisms().subscribe(result => {
      for (const r of result) {
        console.log(r)
      }
    })
  }
}
