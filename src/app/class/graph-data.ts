import {DataFrame, IDataFrame} from "data-forge";

export class GraphData {
  data: IDataFrame = new DataFrame()
  selectedProteins: string[] = []
}
