import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";
import { Tuple2Reader } from "./Tuple2Reader";

export class WrappedReader<T, Wrapper> extends AbstractReader<T> {
  reader: Reader<T>;
  wrapper: Reader<Wrapper>;
  constructor(reader: Reader<T>, wrapper: Reader<Wrapper>) {
    super();
    this.reader = reader;
    this.wrapper = wrapper;
  }
  read(str: string, index: number): ReadToken<T> | null {
    const reader = new Tuple2Reader(
      this.wrapper,
      new Tuple2Reader(
        this.reader,
        this.wrapper
      )
    );
    const value = reader.read(str, index);
    if (value == null) return null;
    const token = value.value[1].value[0]
    return {
      value: token.value,
      position: token.position,
      length: token.length,
      next: value.next
    };
  }
}