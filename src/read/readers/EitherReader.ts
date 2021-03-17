import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

export class EitherReader<Left, Right> extends AbstractReader<Left|Right> {
  leftReader: Reader<Left>;
  rightReader: Reader<Right>;
  get label(): string {
    return `${this.leftReader.label} | ${this.rightReader.label}`;
  }
  constructor(left: Reader<Left>, right: Reader<Right>) {
    super();
    this.leftReader = left;
    this.rightReader = right;
  }
  read(str: string, index: number): ReadResult<Left | Right> {
    const leftValue = this.leftReader.read(str, index);
    if (leftValue.type !== 'failure') return leftValue;
    const rightValue = this.rightReader.read(str, index);
    if (rightValue.type !== 'failure') return rightValue;
    return {
      type: 'failure',
      errors: leftValue.errors.concat(rightValue.errors)
    };
  }
}