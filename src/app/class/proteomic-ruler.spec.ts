import { DataFrame } from 'data-forge';
import { HistoneDb } from './histone-db';
import { ProteomicRuler } from './proteomic-ruler';
import { WebService } from '../service/web.service';

describe('ProteomicRuler', () => {
  const genomeSize = 3e9;

  function createHistoneDb(): HistoneDb {
    const histone = new HistoneDb({} as WebService);
    histone.data = new DataFrame([
      { name: 'Homo sapiens', genome_size: genomeSize, histone_ids: 'H1' },
      { name: 'Homo sapiens', genome_size: genomeSize, histone_ids: 'H2' },
    ]).setIndex('histone_ids').bake();
    return histone;
  }

  function createRuler(): ProteomicRuler {
    const df = new DataFrame([
      { 'Majority protein IDs': 'H1', 'Mol. weight [kDa]': '10', 'Intensity A': 100 },
      { 'Majority protein IDs': 'P1', 'Mol. weight [kDa]': '20', 'Intensity A': 50 },
      { 'Majority protein IDs': 'P2', 'Mol. weight [kDa]': '40', 'Intensity A': 800 },
    ]);
    return new ProteomicRuler(createHistoneDb(), df);
  }

  it('should detect intensity columns and organism', () => {
    const ruler = createRuler();
    expect(ruler.intensityCols).toEqual(['Intensity A']);
    expect(ruler.organism.name).toBe('Homo sapiens');
    expect(ruler.histone_in_df).toEqual(['H1']);
  });

  it('should scale histone mass to the DNA mass of the genome', () => {
    const ruler = createRuler();
    const copyNumbers = ruler.df.getSeries('Intensity A_copyNumber').toArray();
    const histoneMassDa = ruler.df.getSeries('Mol. weight [kDa]').toArray()[0];
    expect(histoneMassDa).toBe(10000);
    expect(copyNumbers[0] * histoneMassDa).toBeCloseTo(genomeSize * ruler.base_pair_weight * ruler.ploidy, -3);
  });

  it('should rank copy numbers in descending order', () => {
    const ruler = createRuler();
    expect(ruler.df.getSeries('Intensity A_copyNumber_rank').toArray()).toEqual([2, 3, 1]);
  });

  it('should leave masses in Dalton when the median is already large', () => {
    const ruler = createRuler();
    expect(ruler.convertToDalton([10000, 20000, 30000])).toEqual([10000, 20000, 30000]);
    expect(ruler.convertToDalton([10, 20, 30])).toEqual([10000, 20000, 30000]);
  });
});
