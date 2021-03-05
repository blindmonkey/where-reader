import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class SeparatedReader<T, Separator> extends AbstractReader<ReadToken<T>[]> {
  reader: Reader<T>;
  sep: Reader<Separator>;
  constructor(reader: Reader<T>, sep: Reader<Separator>) {
    super();
    this.reader = reader;
    this.sep = sep;
  }
  read(str: string, index: number): ReadToken<ReadToken<T>[]> | null {
    const reader = this.reader
      .then(this.sep.then(this.reader).repeated())
      .map((value) => [value[0]].concat(value[1].value.map((token) => token.value[1])))
    const value = reader.read(str, index);
    if (value == null) {
      return {
        value: [],
        position: index,
        length: 0,
        next: index
      };
    }
    return value;
  }
}