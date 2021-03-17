import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";
import { Tuple2Reader } from "./Tuple2Reader";

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
    if (result.type === 'failure') return result;
    const token = result.value[1].value[0]
    return {
      type: 'token',
      value: token.value,
      position: token.position,
      length: token.length,
      next: result.next,
      failures: result.failures
    };
  }
}