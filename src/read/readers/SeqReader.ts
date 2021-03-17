import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadFailure, ReadResult, ReadToken } from "../ReadResult";

export class SeqReader<T> extends AbstractReader<ReadToken<T>[]> {
  readers: Reader<T>[];
  get label(): string {
    return this.readers.map(r => r.label).join(' ');
  }
  constructor(readers: Reader<T>[]) {
    super();
    this.readers = readers;
  }
  read(str: string, index: number): ReadResult<ReadToken<T>[]> {
    if (this.readers.length === 0) {
      return {
        type: 'token',
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
      if (value.type === 'failure') return value;
      tokens.push(value);
      i = value.next;
    }
    const lastToken = tokens[tokens.length - 1];
    return {
      type: 'token',
      value: tokens,
      position: index,
      length: lastToken == null ? 0 : lastToken.position + lastToken.length - index,
      next: lastToken == null ? index : lastToken.next,
      failures: tokens.map(tokens => tokens.failures ?? []).flatMap(t => t)
    };
  }
}