import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

/**
 * Reads something between two other readers where the left and right readers
 * don't matter. For instance, reading something between parentheses.
 */
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
  read(str: string, index: number): ReadResult<Middle> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') return result;
    const middle = result.value;
    return {
      type: 'token',
      value: middle.value,
      position: middle.position,
      length: middle.length,
      next: result.next,
      errors: result.errors
    };
  }
}