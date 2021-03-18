import { CharReader } from "./readers/CharReader";
import { EOFReader } from "./readers/EOFReader";
import { LiteralReader } from "./readers/LiteralReader";
import { NextCharReader } from "./readers/NextCharReader";
import { RegexCharReader } from "./readers/RegexCharReader";

export class Read {
  /**
   * Read a single character, either in case-sensitive or -insensitive mode.
   * @see CharReader
   * @param expected The expected character to read.
   * @param caseSensitive Whether the read should be case-sensitive.
   * @returns A `Reader` which reads the character.
   */
  static char<T extends string>(expected: T, caseSensitive: boolean = true): CharReader<T> {
    return new CharReader(expected, caseSensitive);
  }

  static nextChar(): NextCharReader {
    return new NextCharReader();
  }

  /**
   * Reads an expected string literal, either in case-sensitive or -insensitive
   * mode.
   * @see LiteralReader
   * @param literal The expected literal to read.
   * @param caseSensitive Whether the read should be case-sensitive.
   * @returns A `Reader` which reads the string literal.
   */
  static literal<T extends string>(literal: T, caseSensitive: boolean = true): LiteralReader<T> {
    return new LiteralReader(literal, caseSensitive);
  }

  /**
   * Read a single character that matches the given `regex`.
   * @see RegexCharReader
   * @param regex A regular expression that may match a single character.
   * @returns A reader which succeeds when the next character matches the given
   * regular expression.
   */
  static regexChar(regex: RegExp): RegexCharReader {
    return new RegexCharReader(regex);
  }

  /**
   * Ensure that there are no more characters in the string being read.
   * @returns A `Reader` which succeeds when at the end of the string.
   */
  static eof(): EOFReader {
    return new EOFReader();
  }
}