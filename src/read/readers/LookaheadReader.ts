import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

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

  read(str: string, index: number): ReadResult<T> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') return result;
    const token = result.value;
    return {
      type: 'token',
      position: token.position,
      next: token.next,
      length: token.length,
      value: token.value,
      failures: result.failures
    };
  }
}