import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class OptionalReader<T> extends AbstractReader<T | null> {
  reader: Reader<T>;
  constructor(reader: Reader<T>) {
    super();
    this.reader = reader;
  }
  read(str: string, index: number): ReadToken<T | null> {
    const value = this.reader.read(str, index);
    if (value == null) {
      return {
        value: null,
        position: index,
        next: index,
        length: 0
      };
    }
    return value;
  }
}