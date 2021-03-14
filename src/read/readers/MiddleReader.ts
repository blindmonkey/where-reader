import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class MiddleReader<Left, Middle, Right> extends AbstractReader<Middle> {
  reader: Reader<ReadToken<Middle>>;
  get label(): string {
    return this.reader.label;
  }
  constructor(left: Reader<Left>, middle: Reader<Middle>, right: Reader<Right>) {
    super();
    this.reader = left
      .then(middle)
      .then(right)
      .map(value => value[0].value[1]);
  }
  read(str: string, index: number): ReadToken<Middle> | null {
    const value = this.reader.read(str, index);
    if (value == null) return null;
    const middle = value.value;
    return {
      value: middle.value,
      position: middle.position,
      length: middle.length,
      next: value.next
    };
  }
}