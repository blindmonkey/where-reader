import { CharReader } from "./readers/CharReader";
import { EOFReader } from "./readers/EOFReader";
import { LiteralReader } from "./readers/LiteralReader";
import { RegexCharReader } from "./readers/RegexCharReader";

export class Read {
  static char<T extends string>(expected: T, caseSensitive: boolean = true): CharReader<T> {
    return new CharReader(expected, caseSensitive);
  }
  static literal<T extends string>(literal: T, caseSensitive: boolean = true): LiteralReader<T> {
    return new LiteralReader(literal, caseSensitive);
  }
  static regexChar(regex: RegExp): RegexCharReader {
    return new RegexCharReader(regex);
  }
  static eof(): EOFReader {
    return new EOFReader();
  }
}