import {DataFrame, fromJSON, fromObject, IDataFrame} from "data-forge";
import {WebService} from "../service/web.service";

export class HistoneDb {
  //df: DataFrame;
  data: IDataFrame = new DataFrame()
  constructor(private http: WebService) {
  }

  getHistones() {
    const res: any[] = []
    this.http.getOrganisms().subscribe(result => {
      for (const r of result) {
        for (const h of r["histone_ids"]) {
          const a = {name: "", genome_size: 0, histone_ids: ""}
          a.name = r.name
          a.genome_size = r.genome_size
          a.histone_ids = h
          res.push(a)
        }
      }
      this.data = new DataFrame(res)
      this.data = this.data.setIndex("histone_ids").bake()
    })
  }

  checkHistones(ids: any[], organisms: string = "") {
    //const s = this.data.getIndex().bake().toPairs();
    const inter = this.data.where(r => ids.includes(r.histone_ids)).bake()
    if (inter.count() >0) {
      if (organisms !== "") {
        return inter.where(r => r["name"]===organisms).bake()
      }
    }
    return inter
  }

  getOrganism(ids: any[]) {
    const res = this.checkHistones(ids)
    const data: any[] = []

    for (const r of res.groupBy(g => g.name).bake()) {
      for (const r2 of r.groupBy(g2 => g2["genome_size"]).bake()) {
        const first = r2.first()
        const c = r2.count()
        data.push({"name": first["name"], "genome_size": first["genome_size"], "value": c})
      }
    }
    const df = new DataFrame(data);
    const df2 = df.orderByDescending(r => r.value).bake()
    return df2.first()
  }

}
