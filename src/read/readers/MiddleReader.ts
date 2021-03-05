import { AbstractReader } from "./AbstractReader";
import { Reader } from "./Reader";
import { ReadToken } from "./ReadToken";

export class MiddleReader<Left, Middle, Right> extends AbstractReader<Middle> {
  leftReader: Reader<Left>;
  middleReader: Reader<Middle>;
  rightReader: Reader<Right>;
  constructor(left: Reader<Left>, middle: Reader<Middle>, right: Reader<Right>) {
    super();
    this.leftReader = left;
    this.middleReader = middle;
    this.rightReader = right;
  }
  read(str: string, index: number): ReadToken<Middle> | null {
    const reader = this.leftReader
      .then(this.middleReader)
      .then(this.rightReader)
      .map((value) => value[0].value[1])
    const value = reader.read(str, index);
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