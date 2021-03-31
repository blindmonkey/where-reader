import { Read } from "../../read/Read";

// sign
//   ""
//   '+'
//   '-'
const sign = Read.char('+')
  .or(Read.char('-'))
  .optional()
  .map(v => v ?? '');

// onenine
//   '1' . '9'
const onenine = Read.regexChar(/[1-9]/);

// digit
//   '0'
//   onenine
const digit = Read.char('0').or(onenine);

// digits
//   digit
//   digit digits
const digits = digit
  .then(digit.repeated()
    .map(t => t.map(t => t.value).join('')))
  .map(t => `${t[0].value}${t[1].value}`)
  .labeled('digits');

// exponent =
//   ""
//   'E' sign digits
//   'e' sign digits
const exponent = Read.seq(
  Read.char('e', false),
  sign,
  digits)
  .map(t => t.map(t => t.value).join(''))
  .optional().map(v => v ?? '')
  .labeled('exponent');

// integer
//   digit
//   onenine digits
//   '-' digit
//   '-' onenine digits
const integer = Read.seq(
  Read.char('-').optional().map(c => c ?? ''),
  onenine.then(digits).map(t => `${t[0].value}${t[1].value}`)
    .or(digit))
  .map(t => t.map(t => t.value).join(''))
  .labeled('integer');

// fraction
//   ""
//   '.' digits
const fraction = Read.seq(Read.char('.'), digits)
  .map(t => `${t[0].value}${t[1].value}`)
  .optional()
  .map(t => t ?? '')
  .labeled('fractional component');

// number
//   integer fraction exponent
export const number = Read.seq(integer, fraction, exponent)
  .map(t => t.map(t => t.value).join(''))
  .labeled('number literal');

export const boolean = Read.literal('true').map<true>(() => true)
  .or(Read.literal('false').map<false>(() => false))
  .labeled('boolean literal');

const hexChar = Read.regexChar(/[0-9a-fA-F]/);

// unescaped = %x20-21 / %x23-5B / %x5D-10FFFF
const unescaped = Read.regexChar(/[\x20-\x21\x23-\x5B]/)
  .or(Read.nextChar().failWhen(c => c.charCodeAt(0) < 0x5D))
  .labeled('valid unescaped char', {simplify: true});
const stringChar =
  Read.char('\\')
    .then(
      Read.char('\\').map(() => '\\')
      .or(Read.char('"').map(() => '"'))
      .or(Read.char('/').map(() => '\/'))
      .or(Read.char('n').map(() => '\n'))
      .or(Read.char('r').map(() => '\r'))
      .or(Read.char('t').map(() => '\t'))
      .or(Read.char('b').map(() => '\b'))
      .or(Read.char('f').map(() => '\f'))
      .or(Read.seq(Read.char('u'), hexChar, hexChar, hexChar, hexChar)
        .map(t => String.fromCharCode(parseInt(`${t[1].value}${t[2].value}${t[3].value}${t[4].value}`, 16))))
      .or(Read.fail('valid escape character'))
      .labeled('valid escape character', {relabel: true}))
      .map(t => t[1].value)
    .or(unescaped);
export const string = stringChar.repeated()
  .map(chars => chars.map(c => c.value).join(''))
  .wrappedBy(Read.char('"'))
  .labeled('string literal');