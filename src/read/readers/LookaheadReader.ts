import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class LookaheadReader<T, Ahead> extends AbstractReader<T> {
  reader: Reader<T>;
  ahead: Reader<Ahead>;
  constructor(reader: Reader<T>, ahead: Reader<Ahead>) {
    super();
    this.reader = reader;
    this.ahead = ahead;
  }

  read(str: string, index: number): ReadToken<T> | null {
    const reader = this.reader.then(this.ahead);
    const value = reader.read(str, index);
    if (value == null) return null;
    return value.value[0];
  }
}