import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class CharReader<T extends string> extends AbstractReader<T> {
  expected: T;
  caseSensitive: boolean;
  constructor(expected: T, caseSensitive: boolean = true) {
    super();
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
  read(str: string, index: number): ReadToken<T>|null {
    if (index >= str.length) return null;
    const char = str[index];
    if (!this.compare(char)) return null;
    return {
      value: this.expected,
      position: index,
      length: 1,
      next: index + 1
    };
  }
}