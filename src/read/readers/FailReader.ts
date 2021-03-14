import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class FailReader<T> extends AbstractReader<T> {
  reader: Reader<T>;
  condition: (value: T) => boolean;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<T>, condition: (value: T) => boolean) {
    super();
    this.reader = reader;
    this.condition = condition;
  }
  read(str: string, index: number): ReadToken<T> | null {
    const value = this.reader.read(str, index);
    if (value == null) return null;
    if (this.condition(value.value)) {
      return null;
    }
    return value;
  }
}