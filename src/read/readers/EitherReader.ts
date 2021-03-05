import { AbstractReader } from "./AbstractReader";
import { Reader } from "./Reader";
import { ReadToken } from "./ReadToken";

export class EitherReader<Left, Right> extends AbstractReader<Left|Right> {
  leftReader: Reader<Left>;
  rightReader: Reader<Right>;
  constructor(left: Reader<Left>, right: Reader<Right>) {
    super();
    this.leftReader = left;
    this.rightReader = right;
  }
  read(str: string, index: number): ReadToken<Left|Right> | null {
    const leftValue = this.leftReader.read(str, index);
    if (leftValue != null)
      return leftValue;
    const rightValue = this.rightReader.read(str, index);
    if (rightValue != null)
      return rightValue;
    return null;
  }
}