import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class LookaheadReader<T, Ahead> extends AbstractReader<T> {
  reader: Reader<ReadToken<T>>;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<T>, ahead: Reader<Ahead>) {
    super();
    this.reader = reader.then(ahead)
      .map(tokens => tokens[0]);
  }

  read(str: string, index: number): ReadToken<T> | null {
    const value = this.reader.read(str, index);
    if (value == null) return null;
    return value.value;
  }
}