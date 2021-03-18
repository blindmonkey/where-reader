import { AbstractReader } from "../AbstractReader";
import { ReadFailure, ReadResult } from "../ReadResult";

/**
 * Reads a single specific character from the next index. Read will fail when
 * the character doesn't match the expected character. This reader can be either
 * case-sensitive or insensitive, and is case-sensitive by default.
 */
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
    // EOF case
    if (index >= str.length) return this.failure(index);
    // Char doesn't match
    if (!this.compare(str[index])) return this.failure(index);
    return {
      type: 'token',
      // It seems more valuable to return the expected character since in the
      // case-insensitive mode of operation, this would end up being
      // unpredictable. This way, it's guaranteed to match `T` when `T` is a
      // specific character string.
      value: this.expected,
      position: index,
      length: 1,
      next: index + 1,
      errors: []
    };
  }
}