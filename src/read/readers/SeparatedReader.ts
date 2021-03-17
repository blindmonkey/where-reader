import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

export class SeparatedReader<T, Separator> extends AbstractReader<ReadToken<T>[]> {
  reader: Reader<T>;
  sep: Reader<Separator>;
  get label(): string {
    return `[${this.reader.label} separated by ${this.sep.label}]`;
  }
  constructor(reader: Reader<T>, sep: Reader<Separator>) {
    super();
    this.reader = reader;
    this.sep = sep;
  }
  read(str: string, index: number): ReadResult<ReadToken<T>[]> {
    const reader = this.reader
      .then(this.sep.then(this.reader).repeated())
      .map((value) => [value[0]].concat(value[1].value.map((token) => token.value[1])))
    const value = reader.read(str, index);
    if (value.type === 'failure') {
      return {
        type: 'token',
        value: [],
        position: index,
        length: 0,
        next: index,
        failures: value.errors
      };
    }
    return value;
  }
}