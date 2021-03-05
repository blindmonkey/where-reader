import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";
import { CharReader } from "./CharReader";
import { SeqReader } from "./SeqReader";

export class LiteralReader<T extends string> extends AbstractReader<T> {
  reader: SeqReader<string>;
  constructor(expected: string) {
    super();
    const readers: CharReader<any>[] = [];
    for (let i = 0; i < expected.length; i++) {
      readers.push(new CharReader(expected[i]));
    }
    this.reader = new SeqReader(readers);
  }
  read(str: string, index: number): ReadToken<T>|null {
    const value = this.reader.read(str, index);
    if (value == null) return null;
    return {
      value: value.value.map((token) => token.value).join('') as T,
      position: value.position,
      length: value.length,
      next: value.next
    };
  }
}