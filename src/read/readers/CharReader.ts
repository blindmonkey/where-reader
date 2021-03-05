import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class CharReader<T extends string> extends AbstractReader<string> {
  expected: T;
  constructor(expected: T) {
    super();
    if (expected.length !== 1)
      throw 'CharReader can only read one character at a time';
    this.expected = expected;
  }
  read(str: string, index: number): ReadToken<string>|null {
    if (str[index] === this.expected) {
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