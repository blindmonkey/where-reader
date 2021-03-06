import { Reader } from "./Reader";
import { AnyReader } from "./readers/AnyReader";
import { DelegatingReader } from "./readers/DelegatingReader";
import { SeqReader } from "./readers/SeqReader";
import { ReadFailure, ReadResult } from "./ReadResult";

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
    if (expected.length !== 1)
      throw 'Read.char can only read one character at a time';
    return Read.nextChar()
      .failWhen(value => !compare(value), `< == ${expected}>`)
      .mapToken(() => expected, label)
      .mapFailure(
        (_1, _2, index) => ReadResult.failure(ReadResult.error(label, index)),
        label);
  }

  static empty(): Reader<null> {
    return new DelegatingReader((_, index) =>
      ReadResult.token(null, {
        position: index,
        length: 0,
        next: index
      }), '<empty>');
  }

  public static any: typeof AnyReader.make =
    (...readers) => AnyReader.make(...readers);

  public static seq: typeof SeqReader.make =
    (...readers) => SeqReader.make(...readers);

  static nextChar(): Reader<string> {
    const label = '<any char>';
    return Read.empty()
      .failWhen((_, str, index) => index >= str.length, '<not EOF>')
      .mapFailure((_1, _2, index) =>
        ReadResult.failure(ReadResult.error(label, index)),
        label)
      .flatMap((_, str, index) => ReadResult.token(str[index], {
        position: index,
        length: 1,
        next: index + 1
      }), label);
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
    const reader = Read.seq(...readers);
    return reader
      .mapResult<T>((result, _, index) =>
        ReadResult.flatMap(
          result,
          result =>
            ReadResult.token(
              result.value.map(token => token.value).join('') as T, {
                position: result.position,
                length: result.length,
                next: result.next,
                errors: []
              }),
            _ => ReadResult.failure(ReadResult.error(label, index))),
        label);
  }

  /**
   * Read a single character that matches the given `regex`.
   * @see RegexCharReader
   * @param regex A regular expression that may match a single character.
   * @returns A reader which succeeds when the next character matches the given
   * regular expression.
   */
  static regexChar(regex: RegExp): Reader<string> {
    const label = `${regex}`;
    return Read.nextChar()
      .failWhen(char => !regex.test(char))
      .mapFailure((_1, _2, index) => ReadResult.failure(ReadResult.error(label, index)));
  }

  /**
   * Ensure that there are no more characters in the string being read.
   * @returns A `Reader` which succeeds when at the end of the string.
   */
  static eof(): Reader<null> {
    const label = '<EOF>';
    return Read.empty()
      .failWhen((_, str, index) => index < str.length)
      .mapFailure(
        (_, _str, index) =>
          ReadResult.failure(ReadResult.error(label, index)),
        label);
  }

  static fail(expected: string): Reader<never>;
  static fail(f: (str: string, index: number) => ReadFailure): Reader<never>;
  static fail(f: string | ((str: string, index: number) => ReadFailure)): Reader<never> {
    const label = '<fail>';
    if (typeof f === 'string') {
      const expected = f;
      f = (_, position) =>
        ReadResult.failure(ReadResult.error(expected, position));
    }
    return new DelegatingReader(f, label);
  }
}