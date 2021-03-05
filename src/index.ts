import { DelegatingReader } from "./read/readers/DelegatingReader";
import { Read } from "./read/Read";

const openParen = Read.char('(').labeled('open-paren');
const closeParen = Read.char(')').labeled('close-paren');
const and = Read.literal('and').labeled('and-literal');
const or = Read.literal('or').labeled('or-literal');
const comma = Read.literal(',').labeled('comma');
const whitespaceChar =
  Read.char(' ')
    .or(Read.char('\t'))
    .or(Read.char('\n'))
    .labeled('whitespace-char');
const whitespace = whitespaceChar.repeated().labeled('whitespace');
// The first character of an identifier must be a letter or underscore
const identifierFirstChar = Read.regexChar(/[a-zA-Z_]/);
const identifierSubsequentChar = Read.regexChar(/[a-zA-Z0-9_]/);
const identifier = identifierFirstChar.then(identifierSubsequentChar.repeated())
  .map((tokens) => tokens[0].value + tokens[1].value.map(t => t.value).join(''))
  .labeled('identifier');
const number =
  Read.regexChar(/\d/).repeated()
  .map((tokens) => tokens.map((token) => token.value).join(''))
  .labeled('number');

const literal = identifier.or(number).labeled('literal');
const literalList = literal
  .separatedBy(comma.wrappedBy(whitespace))
  .between(openParen, closeParen)
  .labeled('literal-list');

const value = literal.or(identifier)
  .labeled('value');

const equalityOperator =
  Read.literal('=')
  .or(Read.literal('<='))
  .or(Read.literal('>='))
  .or(Read.literal('<'))
  .or(Read.literal('>'))
  .labeled('equality-op');

const condition = identifier.then(equalityOperator.wrappedBy(whitespace).then(value))
  .or(identifier.then(Read.literal('in').wrappedBy(whitespace).then(literalList)))
  .labeled('condition');

const exprDel = new DelegatingReader<any>()
  .labeled('expression');
const ands = condition
  .or(exprDel.between(openParen, closeParen))
  .separatedBy(and)
  .labeled('ands');
const ors = ands.separatedBy(or)
  .or(exprDel.between(openParen, closeParen))
  .labeled('ors');

exprDel.delegate = ors;
const expr = exprDel.then(Read.eof())
  .map(t => t[0]);

console.log(JSON.stringify(expr.read('x = 5', 0)));
