import { AbstractReader } from "../AbstractReader";
import { ReadResult } from "../ReadResult";
import { CharReader } from "./CharReader";
import { SeqReader } from "./SeqReader";

/**
 * Reads a string literal. `T` should be specified to be a specific string,
 * though could simply be `string` if the situation calls for it.
 */
export class LiteralReader<T extends string> extends AbstractReader<T> {
  label: string;
  reader: SeqReader<string>;
  constructor(expected: string, caseSensitive: boolean = true) {
    super();
    this.label = `"${expected}"`
    const readers: CharReader<any>[] = [];
    for (let i = 0; i < expected.length; i++) {
      readers.push(new CharReader(expected[i], caseSensitive));
    }
    this.reader = new SeqReader(readers);
  }
  read(str: string, index: number): ReadResult<T> {
    const value = this.reader.read(str, index);
    if (value.type === 'failure') {
      return {
        type: 'failure',
        errors: [{
          expected: this.label,
          position: index,
          context: []
        }]
      };
    }
    return {
      type: 'token',
      value: value.value.map(token => token.value).join('') as T,
      position: value.position,
      length: value.length,
      next: value.next,
      errors: []
    };
  }
}