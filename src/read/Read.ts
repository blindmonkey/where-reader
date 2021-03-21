import { Reader } from "./Reader";
import { EOFReader } from "./readers/EOFReader";
import { NextCharReader } from "./readers/NextCharReader";
import { RegexCharReader } from "./readers/RegexCharReader";
import { SeqReader } from "./readers/SeqReader";
import { ReadFailure, ReadResult, ReadToken } from "./ReadResult";

export class Read {
  /**
   * Read a single character, either in case-sensitive or -insensitive mode.
   * @see CharReader
   * @param expected The expected character to read.
   * @param caseSensitive Whether the read should be case-sensitive.
   * @returns A `Reader` which reads the character.
   */
  static char<T extends string>(expected: T, caseSensitive: boolean = true): Reader<T> {
    function compare(char: string): boolean {
      if (caseSensitive) {
        return char === expected;
      }
      return char.toLowerCase() === expected.toLowerCase();
    }
    const label = `'${expected}'`;
    function failure(index: number): ReadFailure {
      return {
        type: 'failure',
        errors: [{
          position: index,
          expected: label,
          context: []
        }]
      };
    }
    if (expected.length !== 1)
      throw 'Read.char can only read one character at a time';
    return Read.nextChar()
      .mapResult<T>((result, _, index) => {
        if (result.type === 'failure') {
          return failure(index);
        }
        // Char doesn't match
        if (!compare(result.value)) {
          return failure(index);
        }
        return {
          type: 'token',
          // It seems more valuable to return the expected character since in the
          // case-insensitive mode of operation, this would end up being
          // unpredictable. This way, it's guaranteed to match `T` when `T` is a
          // specific character string.
          value: expected,
          position: result.position,
          length: result.length,
          next: result.next,
          errors: []
        };
      }, label)
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
  static literal<T extends string>(literal: T, caseSensitive?: boolean): Reader<T> {
    const readers: Reader<string>[] = [];
    for (let i = 0; i < literal.length; i++) {
      readers.push(Read.char(literal[i], caseSensitive));
    }
    const label = `"${literal}"`;
    const reader = new SeqReader(readers);
    return reader
      .mapResult((result, _, index) => {
        if (result.type === 'failure') {
          const failure: ReadFailure = {
            type: 'failure',
            errors: [{
              expected: label,
              position: index,
              context: []
            }]
          };
          return failure;
        }
        return {
          type: 'token',
          value: result.value.map(token => token.value).join('') as T,
          position: result.position,
          length: result.length,
          next: result.next,
          errors: []
        };
      }, label);
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