import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class SeqReader<T> extends AbstractReader<ReadToken<T>[]> {
  readers: Reader<T>[];
  get label(): string {
    return this.readers.map(r => r.label).join(' ');
  }
  constructor(readers: Reader<T>[]) {
    super();
    this.readers = readers;
  }
  read(str: string, index: number): ReadToken<ReadToken<T>[]>|null {
    if (this.readers.length === 0) {
      return {
        value: [],
        position: index,
        length: 0,
        next: index
      };
    }
    const tokens: ReadToken<T>[] = [];
    let i = index;
    for (let r = 0; r < this.readers.length; r++) {
      const reader = this.readers[r];
      const value = reader.read(str, i);
      if (value == null) return null;
      tokens.push(value);
      i = value.next;
    }
    const lastToken = tokens[tokens.length - 1];
    return {
      value: tokens,
      position: index,
      length: lastToken == null ? 0 : lastToken.position + lastToken.length - index,
      next: lastToken == null ? index : lastToken.next
    };
  }
}