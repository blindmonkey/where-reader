import { DelegatingReader } from "./read/readers/DelegatingReader";
import { Read } from "./read/Read";
import { Reader } from "./read/Reader";

interface IToken<Type extends string> {
  type: Type;
}
interface WhitespaceToken extends IToken<'whitespace'> {
  content: string;
}
interface IdentifierToken extends IToken<'identifier'> {
  identifier: string;
}
interface NumberLiteral extends IToken<'number'> {
  value: string;
}
type Operator = '=' | '<=' | '>=' | '<' | '>' | 'in' | 'and' | 'or';
type Literal = NumberLiteral | IdentifierToken;
interface List extends IToken<'list'> {
  // TODO: These should probably be List | Literal | OperatorTokens
  tokens: Literal[];
}
interface RHSOperand {
  operator: Operator;
  token: List | Literal | OperatorTokens;
}
interface OperatorTokens extends IToken<'operator'> {
  tokens: [List | Literal | OperatorTokens, ...RHSOperand[]]
}

const openParen = Read.char('(').labeled('open-paren');
const closeParen = Read.char(')').labeled('close-paren');
const and = Read.literal('and', false).labeled('and-literal');
const or = Read.literal('or', false).labeled('or-literal');
const comma = Read.literal(',').labeled('comma');
const whitespaceChar =
  Read.char(' ')
    .or(Read.char('\t'))
    .or(Read.char('\n'))
    .labeled('whitespace-char');
const whitespace: Reader<WhitespaceToken> =
  whitespaceChar.repeated().labeled('whitespace')
  .map(chars => ({type: 'whitespace', content: chars.map(c => c.value).join('')}));
// The first character of an identifier must be a letter or underscore
const identifierFirstChar = Read.regexChar(/[a-zA-Z_]/);
const identifierSubsequentChar = Read.regexChar(/[a-zA-Z0-9_]/);
const identifier: Reader<IdentifierToken> =
  identifierFirstChar.then(identifierSubsequentChar.repeated())
  .map((tokens) => tokens[0].value + tokens[1].value.map(t => t.value).join(''))
  .labeled('identifier')
  .map(id => ({type: 'identifier', identifier: id}));
const digit = Read.regexChar(/\d/);
const number: Reader<NumberLiteral> =
  digit.then(digit.repeated())
  .map(tokens => tokens[0].value + tokens[1].value.map(token => token.value).join(''))
  .labeled('number')
  .map(value => ({type: 'number', value: value}));

const literal: Reader<Literal> = identifier.or(number).labeled('literal');
const list: Reader<List> = literal
  .separatedBy(comma.wrappedBy(whitespace))
  .between(openParen, closeParen)
  .labeled('list')
  // TODO: Preserve position information of the tokens
  .map(tokens => ({type: 'list', tokens: tokens.map(t => t.value)}));

const terminator = Read.regexChar(/[^a-zA-Z_0-9]/);
const operator: Reader<Operator> =
  Read.literal('=')
  .or(Read.literal('<='))
  .or(Read.literal('>='))
  .or(Read.literal('<'))
  .or(Read.literal('>'))
  .or(Read.literal('in', false).lookahead(terminator))
  .or(and.lookahead(terminator))
  .or(or.lookahead(terminator))
  .labeled('operator');

// TODO: It's likely worth simplifying the type here. Instead of `OperatorTokens`,
// it should likely be `Literal | List | OperatorTokens`.
const exprDel = new DelegatingReader<OperatorTokens>()
  .labeled('expression');

exprDel.delegate =
  literal.or(list).or(exprDel.between(openParen, closeParen)).labeled('operator-lhs')
    .then(operator.wrappedBy(whitespace).then(exprDel).labeled('operator-rhs').optional())
    .labeled('operator-list')
  .map(tokens => {
    const rest = tokens[1].value;
    if (rest == null) {
      return {
        type: 'operator',
        tokens: [tokens[0].value]
      }
    } else {
      // Slice doesn't operator properly on tuples, so a cast is necessary here.
      const restRest = rest[1].value.tokens.slice(1) as RHSOperand[];
      const outTokens: [Literal | List | OperatorTokens, ...RHSOperand[]] = [
        tokens[0].value, {
        operator: rest[0].value,
        token: rest[1].value.tokens[0]
      }];
      return {
        type: 'operator',
        tokens: outTokens.concat(restRest)
      } as OperatorTokens
    }
  });
export const expr = exprDel.then(Read.eof())
  .map(t => t[0].value);

console.log(JSON.stringify(expr.read('x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
