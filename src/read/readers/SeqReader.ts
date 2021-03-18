import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

/**
 * Reads a number of explicitly specified `Reader`s arranged sequentially.
 * However, because of a lack of support for variadic generics in TypeScript,
 * `T` must be the same for all the readers.
 */
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
        next: index,
        errors: []
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
      errors: tokens.map(tokens => tokens.errors ?? []).flatMap(t => t)
    };
  }
}