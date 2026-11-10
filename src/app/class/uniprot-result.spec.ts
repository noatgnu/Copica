import { DataFrame } from 'data-forge';
import { UniprotResult } from './uniprot-result';

describe('UniprotResult', () => {
  it('should expose the dataframe and entries passed to the constructor', () => {
    const df = new DataFrame([{ Entry: 'P1' }]);
    const result = new UniprotResult(df, ['P1']);
    expect(result.DataFrame).toBe(df);
    expect(result.Entries).toEqual(['P1']);
  });

  it('should allow replacing the dataframe and entries', () => {
    const result = new UniprotResult(new DataFrame(), []);
    const df = new DataFrame([{ Entry: 'P2' }]);
    result.DataFrame = df;
    result.Entries = ['P2'];
    expect(result.DataFrame).toBe(df);
    expect(result.Entries).toEqual(['P2']);
  });
});
