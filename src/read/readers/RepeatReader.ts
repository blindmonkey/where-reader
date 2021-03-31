import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadFailure, ReadResult, ReadToken } from "../ReadResult";

export class RepeatReader<T> extends AbstractReader<ReadToken<T>[]> {
  reader: Reader<T>;
  get label(): string {
    return `[* ${this.reader.label}]`;
  }
  constructor(reader: Reader<T>) {
    super();
    this.reader = reader;
  }
  read(str: string, index: number): ReadResult<ReadToken<T>[]> {
    const tokens: ReadToken<T>[] = [];
    let i = index;
    let failure: ReadFailure | null = null;
    while (true) {
      const value = this.reader.read(str, i);
      if (ReadResult.isFailure(value)) {
        failure = value;
        break;
      }
      tokens.push(value);
      i = value.next;
    }
    const lastToken = tokens[tokens.length - 1];
    return ReadResult.token(tokens, {
      position: index,
      length: lastToken == null ? 0 : lastToken.position + lastToken.length - index,
      next: lastToken == null ? index : lastToken.next,
      errors: failure.errors
    });
  }

}