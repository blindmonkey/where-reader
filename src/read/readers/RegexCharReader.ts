import { AbstractReader } from "../AbstractReader";
import { ReadResult } from "../ReadResult";

/**
 * Reads a single character that matches the given `RegExp`.
 */
export class RegexCharReader extends AbstractReader<string> {
  label: string;
  regex: RegExp;
  constructor(regex: RegExp) {
    super();
    this.label = `${regex}`;
    this.regex = regex;
  }
  read(str: string, index: number): ReadResult<string> {
    if (index >= str.length) {
      return ReadResult.failure([{
        expected: this.label,
        position: index,
        context: []
      }]);
    }
    const char = str[index];
    if (!this.regex.test(char)) {
      return ReadResult.failure([{
        expected: this.label,
        position: index,
        context: []
      }]);
    }
    return ReadResult.token(char, {
      position: index,
      length: 1,
      next: index + 1,
      errors: []
    });
  }
}