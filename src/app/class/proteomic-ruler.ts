import {DataFrame, IDataFrame, Series} from "data-forge";
import {HistoneDb} from "./histone-db";



export class ProteomicRuler {
  //df: DataFrame;
  sampleColumnNames: Map<string, string> = new Map<string, string>();
  regexSampleName = new RegExp("^[Ii]ntensity(.*)$")
  molecular_mass_col = "Mol. weight [kDa]"
  protein_ids_column = "Majority protein IDs"
  avogadro = 6.02214129e23
  base_pair_weight = 615.8771
  histone: HistoneDb
  df: IDataFrame
  intensityCols: string[] = []
  organism: any = {}
  cvalue: number = 0
  ploidy:number = 2
  histone_in_df: string[] = []
  factor: any;
  histone_mass: number = 0
  total_molecules: number = 0
  total_protein: number = 0
  constructor(histone: HistoneDb, dataframe: IDataFrame, selectedIntensityCols: string[] = [], selectedIDCol: string = "Majority protein IDs", molMassCol: string = "Mol. weight [kDa]") {
    this.protein_ids_column = selectedIDCol
    this.molecular_mass_col = molMassCol
    this.histone = histone
    this.df = dataframe
    if (selectedIntensityCols.length!==0) {
      this.intensityCols = selectedIntensityCols
    } else {
      for (const c of this.df.getColumnNames()) {
        const s = c.match(this.regexSampleName)
        if (s) {
          this.intensityCols.push(c)
        }
      }
    }
    let normalizationFactor: number[] = []
    for (const r of this.df) {
      if ((r[this.molecular_mass_col]) && (r[this.molecular_mass_col] !== "")) {
        normalizationFactor.push(parseFloat(r[this.molecular_mass_col]))
      } else {
        normalizationFactor.push(1)
      }
    }
    const mmass = this.df.getSeries(this.molecular_mass_col).bake().toArray()
    this.df = this.df.withSeries(this.molecular_mass_col, new Series(this.convertToDalton(mmass)))

    this.df = this.df.withSeries("normalization_factor", new Series(normalizationFactor)).bake()

    this.getOrganism()
    this.cvalue = this.organism.genome_size * this.base_pair_weight/this.avogadro
    const weightedNormalizedFactor = this.calculateWeightedHistoneSumNormalizationFactor()
    console.log(weightedNormalizedFactor)
    this.calNormalizedFactor(weightedNormalizedFactor)
    console.log(this.factor)
    const copynumber: any = {}
    for (const r of this.df) {
      for (const c of this.intensityCols) {
        let copynum = 0
        if (r[c] && r[c] !== "") {
          if (!(c+"_copyNumber" in copynumber)) {
            copynumber[c+"_copyNumber"] = []
          }
          copynum = r[c] /r["normalization_factor"] *this.factor[c]
        }

        copynumber[c+"_copyNumber"].push(copynum)
        this.total_molecules = this.total_molecules + copynum
        this.total_protein = this.total_protein + copynum * 1e12 / this.avogadro
        if (this.histone_in_df.includes(r[this.protein_ids_column])) {
          this.histone_mass = this.histone_mass + copynum * 1e12 / this.avogadro
        }
      }
    }

    for (const c in copynumber) {
      const ranks = this.rankings(copynumber[c])
      this.df = this.df.withSeries(c+"_rank", new Series(ranks)).bake()
      this.df = this.df.withSeries(c, new Series(copynumber[c])).bake()
    }

  }

  convertToDalton(data: number[]) {
    const res: number[] = []
    if (this.median([...data]) <250) {
      for (const d of data) {
        res.push(d*1000)
      }
    } else {
      return data
    }
    return res
  }

  median(values: number[]){
    if(values.length ===0) return 0;

    values.sort(function(a,b){
      return a-b;
    });

    const half = Math.floor(values.length / 2);

    if (values.length % 2)
      return values[half];

    return (values[half - 1] + values[half]) / 2.0;
  }

  getOrganism() {
    const ids: string[] = []
    for (const i of this.df.getSeries(this.protein_ids_column).bake().toArray()) {
      for (const i2 of i.split(";")) {
        if (!(ids.includes(i2))) {
          ids.push(i2)
        }
      }
    }
    this.organism = this.histone.getOrganism(ids)
  }

  calculateWeightedHistoneSumNormalizationFactor() {
    const organism_histones = this.histone.data.where(r => r.name === this.organism.name).bake()
    const set_organism_histones: any[] = []
    for (const i of organism_histones.getSeries("histone_ids").bake().toArray()) {
      if (!(set_organism_histones.includes(i))) {
        set_organism_histones.push(i)
      }
    }
    const weighted_normalized_summed_histone_intensities_dict: any = {}
    for (const c of this.intensityCols) {
      weighted_normalized_summed_histone_intensities_dict[c] = 0
    }
    for (const r of this.df) {
      if (r[this.protein_ids_column] && (r[this.protein_ids_column] !== "")) {
        const a = r[this.protein_ids_column].split(";")
        for (const i of a) {
          if (set_organism_histones.includes(i)) {
            this.histone_in_df.push(r[this.protein_ids_column])
            for (const c of this.intensityCols) {
              if (r[c] && r[c] !== "") {
                weighted_normalized_summed_histone_intensities_dict[c] =
                  weighted_normalized_summed_histone_intensities_dict[c] + parseFloat(r[c])/ r["normalization_factor"]*parseFloat(r[this.molecular_mass_col])
              }
            }
            break
          }
        }


      }
    }
    return weighted_normalized_summed_histone_intensities_dict
  }

  calNormalizedFactor(weighted_normalized_factor: any) {
    const factor: any = {}
    for (const c of this.intensityCols) {
      factor[c] = this.cvalue * this.ploidy * this.avogadro / weighted_normalized_factor[c]
    }
    this.factor = factor
  }

  rankings(array: number[]) {
    return array
      .map((v, i) => [v, i])
      .sort((a, b) => b[0] - a[0])
      .map((a, i) => [...a, i + 1])
      .sort((a, b) => a[1] - b[1])
      .map(a => a[2]);
  }
}
