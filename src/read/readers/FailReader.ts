import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

/**
 * The `FailReader` asserts a condition and fails the read when the condition is
 * false. This can be useful, for instance, to assert that the number of
 * repeated reads was at least a certain amount.
 */
export class FailReader<T> extends AbstractReader<T> {
  reader: Reader<T>;
  condition: (value: T) => boolean;
  get label(): string {
    return `${this.reader.label} fails on condition`;
  }
  constructor(reader: Reader<T>, condition: (value: T) => boolean) {
    super();
    this.reader = reader;
    this.condition = condition;
  }
  read(str: string, index: number): ReadResult<T> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') {
      return result;
    } else if (this.condition(result.value)) {
      return {
        type: 'failure',
        errors: [{
          expected: this.label,
          position: index,
          context: []
        }]
      };
    }
    return result;
  }
}