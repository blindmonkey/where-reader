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
type Expr = Literal | List | ParenExpression | OperatorTokens;
interface List extends IToken<'list'> {
  tokens: Expr[];
}
interface RHSOperand {
  operator: Operator;
  token: Expr;
}
interface OperatorTokens extends IToken<'operator'> {
  tokens: [Expr, ...RHSOperand[]]
}
interface ParenExpression extends IToken<'parens'> {
  expr: Expr;
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

const exprDel = new DelegatingReader<Expr>()
  .labeled('expression');

const list: Reader<List> = exprDel
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

const parenExpr: Reader<ParenExpression> = exprDel.between(openParen, closeParen)
  .map(tokens => ({
    type: 'parens',
    expr: tokens
  }));

exprDel.delegate =
  literal.or(parenExpr).or(list).labeled('operator-lhs')
    .then(operator.wrappedBy(whitespace).then(exprDel).labeled('operator-rhs').optional())
    .labeled('operator-list')
  .map(tokens => {
    const rest = tokens[1].value;
    if (rest == null) {
      return tokens[0].value;
    } else if (rest[1].value.type === 'operator') {
      // Slice doesn't operator properly on tuples, so a cast is necessary here.
      const restRest = rest[1].value.tokens.slice(1) as RHSOperand[];
      const outTokens: [Expr, ...RHSOperand[]] = [
        tokens[0].value, {
        operator: rest[0].value,
        token: rest[1].value.tokens[0]
      }];
      return {
        type: 'operator',
        tokens: outTokens.concat(restRest)
      // Cast is necessary because concat doesn't handle tuple types correctly.
      } as OperatorTokens;
    } else {
      return {
        type: 'operator',
        tokens: [
          tokens[0].value,
          {operator: rest[0].value, token: rest[1].value}
        ]
      };
    }
  });
export const expr = exprDel.then(Read.eof())
  .map(t => t[0].value);

debugger;
// console.log('hiii');
console.log(JSON.stringify(expr.read('yyz', 0)));
// console.log('hiii 5000');
// console.log(JSON.stringify(expr.read('5000', 0)));
// console.log('hiii 1');
// console.log(JSON.stringify(expr.read('1', 0)));
console.log(JSON.stringify(expr.read('x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x <= 5 and (y >= 3 and y < 5) or z in (1, 2, 3)', 0)));
