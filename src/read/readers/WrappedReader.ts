import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, Symbols } from "../ReadResult";

/**
 * Reads a `T` via a delegate `Reader`, surrounded by `Wrapper`. For instance,
 * useful for reading symbols that may be surrounded by whitespace. The
 * `Wrapper`s are ignored in the final result.
 */
export class WrappedReader<T, Wrapper> extends AbstractReader<T> {
  reader: Reader<T>;
  wrapper: Reader<Wrapper>;
  get label(): string {
    const wlabel = this.wrapper.label;
    return `${wlabel} ${this.reader.label} ${wlabel}`;
  }
  constructor(reader: Reader<T>, wrapper: Reader<Wrapper>) {
    super();
    this.reader = reader;
    this.wrapper = wrapper;
  }
  read(str: string, index: number): ReadResult<T> {
    const reader = this.wrapper.then(this.reader.then(this.wrapper));
    const result = reader.read(str, index);
    return ReadResult.flatMap(result,
      result => {
        const token = result.value[1].value[0];
        return ReadResult.token(token.value, {
          position: token.position,
          length: token.length,
          next: result.next,
          errors: result.errors
        });
      }, failure => failure);
  }
}