import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class RepeatReader<T> extends AbstractReader<ReadToken<T>[]> {
  reader: Reader<T>;
  constructor(reader: Reader<T>) {
    super();
    this.reader = reader;
  }
  read(str: string, index: number): ReadToken<ReadToken<T>[]>|null {
    const tokens: ReadToken<T>[] = [];
    let i = index;
    while (true) {
      const value = this.reader.read(str, i);
      if (value == null) break;
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