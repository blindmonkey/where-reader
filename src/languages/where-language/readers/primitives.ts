import { ReadResult } from "../../../read/ReadResult";
import { Read } from "../../../read/Read";
import { Reader } from "../../../read/Reader";
import { IdentifierToken, Literal, NumberLiteral, StringLiteral, WhitespaceToken } from "../tokens";

const whitespaceChar =
  Read.char(' ')
    .or(Read.char('\t'))
    .or(Read.char('\n'))
    .labeled('whitespace-char');
export const whitespace: Reader<WhitespaceToken> =
  whitespaceChar.repeated().labeled('whitespace')
  .ignoringSuccessFailures()
  .map(chars => ({type: 'whitespace', content: chars.map(c => c.value).join('')}));

  // The first character of an identifier must be a letter or underscore
const identifierFirstChar = Read.regexChar(/[a-zA-Z_]/);
const identifierSubsequentChar = Read.regexChar(/[a-zA-Z0-9_]/);
export const identifier: Reader<IdentifierToken> =
  identifierFirstChar.then(identifierSubsequentChar.repeated())
  .map((tokens) => tokens[0].value + tokens[1].value.map(t => t.value).join(''))
  .mapToken<IdentifierToken>(token => ({
    type: 'identifier',
    identifier: token.value,
    position: token.position,
    length: token.length
  }))
  .labeled('identifier', {relabel: true})
  .ignoringSuccessFailures();

  const digit = Read.regexChar(/\d/);
export const number: Reader<NumberLiteral> =
  digit.then(digit.repeated())
  .map(tokens => tokens[0].value + tokens[1].value.map(token => token.value).join(''))
  .mapToken<NumberLiteral>(token => ({
    type: 'number',
    value: token.value,
    position: token.position,
    length: token.length
  }))
  .labeled('number literal', {relabel: true})
  .ignoringSuccessFailures();

export const string: Reader<StringLiteral> =
  Read.char('\\')
    .then(
      Read.char('n').map(() => '\n')
      .or(Read.char('\\').map(() => '\\'))
      .or(Read.fail((s, i) => ReadResult.failure({
        expected: i < s.length ? `Unsupported character following string escape: ${s[i]}` : 'Unexpected EOF',
        position: i,
        context: []
      }))))
    .or(Read.nextChar().failWhen(c => c === '"'))
    .repeated()
    .wrappedBy(Read.char('"'))
    .map(tokens => tokens.map(token => token.value).join(''))
    .mapToken<StringLiteral>(token => ({
      type: 'string',
      // Compensate for the quotes
      position: token.position - 1,
      length: token.length + 2,
      content: token.value
    }))
    .labeled('string literal', {relabel: true})
    .ignoringSuccessFailures();

export const literal: Reader<Literal> = identifier.or(number).or(string).labeled('literal');