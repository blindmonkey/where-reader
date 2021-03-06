import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class CharReader<T extends string> extends AbstractReader<string> {
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
  read(str: string, index: number): ReadToken<string>|null {
    const char = str[index];
    if (char != null && this.compare(char)) {
      return {
        value: this.expected,
        position: index,
        length: 1,
        next: index + 1
      };
    }
    return null;
  }
}