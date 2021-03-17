import { AbstractReader } from "../AbstractReader";
import { ReadFailure, ReadResult } from "../ReadResult";

export class CharReader<T extends string> extends AbstractReader<T> {
  label: string;
  expected: T;
  caseSensitive: boolean;
  constructor(expected: T, caseSensitive: boolean = true) {
    super();
    this.label = `'${expected}'`;
    if (expected.length !== 1)
      throw 'CharReader can only read one character at a time';
    this.expected = expected;
    this.caseSensitive = caseSensitive;
  }
  private compare(char: string) {
    if (this.caseSensitive) {
      return char === this.expected;
    }
    return char.toLowerCase() === this.expected.toLowerCase();
  }
  private failure(index: number): ReadFailure {
    return {
      type: 'failure',
      errors: [{
        position: index,
        expected: this.label,
        context: []
      }]
    };
  }
  read(str: string, index: number): ReadResult<T> {
    if (index >= str.length) return this.failure(index);
    const char = str[index];
    if (!this.compare(char)) return this.failure(index);
    return {
      type: 'token',
      value: this.expected,
      position: index,
      length: 1,
      next: index + 1
    };
  }
}