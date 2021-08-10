export class HistoneItem {
  constructor(name: string, genome_size: number, histone_ids: string[]) {
    this.name = name;
    this.genome_size = genome_size;
    this.histone_ids = histone_ids;
  }
  name: string;
  genome_size: number;
  histone_ids: string[];
}
