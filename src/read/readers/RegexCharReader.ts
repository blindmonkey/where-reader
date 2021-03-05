import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class RegexCharReader extends AbstractReader<string> {
  regex: RegExp;
  constructor(regex: RegExp) {
    super();
    this.regex = regex;
  }
  read(str: string, index: number): ReadToken<string>|null {
    const char = str[index];
    if (this.regex.test(char)) {
      return {
        value: char,
        position: index,
        length: 1,
        next: index + 1
      };
    }
    return null;
  }
}