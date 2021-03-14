import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class RegexCharReader extends AbstractReader<string> {
  label: string;
  regex: RegExp;
  constructor(regex: RegExp) {
    super();
    this.label = `${regex}`;
    this.regex = regex;
  }
  read(str: string, index: number): ReadToken<string>|null {
    if (index >= str.length) return null;
    const char = str[index];
    if (!this.regex.test(char)) return null;
    return {
      value: char,
      position: index,
      length: 1,
      next: index + 1
    };
  }
}