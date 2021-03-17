import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

export class OptionalReader<T> extends AbstractReader<T | null> {
  reader: Reader<T>;
  get label(): string {
    return `[${this.reader.label}]`;
  }
  constructor(reader: Reader<T>) {
    super();
    this.reader = reader;
  }
  read(str: string, index: number): ReadResult<T | null> {
    const value = this.reader.read(str, index);
    if (value.type === 'failure') {
      return {
        type: 'token',
        value: null,
        position: index,
        next: index,
        length: 0,
        failures: value.errors
      };
    }
    return value;
  }
}