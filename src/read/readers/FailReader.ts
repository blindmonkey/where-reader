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
    return this.reader.label;
  }
  constructor(reader: Reader<T>, condition: (value: T) => boolean) {
    super();
    this.reader = reader;
    this.condition = condition;
  }
  read(str: string, index: number): ReadResult<T> {
    const value = this.reader.read(str, index);
    if (value.type === 'failure') {
      return value;
    } else if (this.condition(value.value)) {
      return {
        type: 'failure',
        errors: [{
          expected: `${this.reader.label} failed by condition`,
          position: index,
          context: []
        }]
      };
    }
    return value;
  }
}