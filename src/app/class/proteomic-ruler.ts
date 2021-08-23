import {DataFrame} from "data-forge";



export class ProteomicRuler {
  //df: DataFrame;
  sampleColumnNames: Map<string, string> = new Map<string, string>();
  regexSampleName = new RegExp("^[Ii]ntensity(.*)$")
  avogadro = 6.02214129e23
  base_pair_weight = 615.8771


}
