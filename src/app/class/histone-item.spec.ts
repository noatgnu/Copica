import { HistoneItem } from './histone-item';

describe('HistoneItem', () => {
  it('should store constructor values', () => {
    const item = new HistoneItem('Homo sapiens', 3e9, ['P1', 'P2']);
    expect(item.name).toBe('Homo sapiens');
    expect(item.genome_size).toBe(3e9);
    expect(item.histone_ids).toEqual(['P1', 'P2']);
  });
});
