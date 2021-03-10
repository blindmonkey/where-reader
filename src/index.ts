import { DelegatingReader } from "./read/readers/DelegatingReader";
import { Read } from "./read/Read";
import { Reader } from "./read/Reader";

function prepend<First, Rest>(first: First, rest: Rest[]): [First, ...Rest[]] {
  return [first as First | Rest].concat(rest) as [First, ...Rest[]];
}
function getRest<First, Rest>(a: [First, ...Rest[]]): Rest[] {
  return a.slice(1) as Rest[];
}
function getLast<T>(a: T[]): T {
  if (a.length === 0) throw 'Cannot get last of an empty array';
  return a[a.length - 1];
}


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
type Operator = '=' | '<=' | '>=' | '<' | '>' | 'in' | 'and' | 'or' | '+' | '-' | '*' | '/' | '^';
type Literal = NumberLiteral | IdentifierToken;
type Expr = Literal | List<Expr> | ParenExpression<Expr> | OperatorTokens;
interface List<Expr> extends IToken<'list'> {
  tokens: Expr[];
}
interface RHSOperand {
  operator: Operator;
  token: Expr;
}
interface OperatorTokens extends IToken<'operator'> {
  tokens: [Expr, ...RHSOperand[]]
}
interface ParenExpression<Expr> extends IToken<'parens'> {
  expr: Expr;
}
interface Binary extends IToken<'binary'> {
  operator: Operator;
  lhs: BExpr;
  rhs: BExpr;
}
type BExpr = Literal | List<BExpr> | Binary;

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

const list: Reader<List<Expr>> = exprDel
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
  .or(Read.literal('+'))
  .or(Read.literal('-'))
  .or(Read.literal('*'))
  .or(Read.literal('/'))
  .or(Read.literal('^'))
  .labeled('operator');

const parenExpr: Reader<ParenExpression<Expr>> = exprDel.between(openParen, closeParen)
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
      return <OperatorTokens>{
        type: 'operator',
        tokens: prepend(
          tokens[0].value,
          [{
            operator: rest[0].value,
            token: rest[1].value.tokens[0]
          }].concat(getRest(rest[1].value.tokens)))
      };
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

function processPrecedence(e: Expr, precedence: {[k in Operator]: {precedence: number, associativity: 'left' | 'right'}}): BExpr {
  switch (e.type) {
    case 'identifier':
    case 'number':
      return e;
    case 'list':
      return {
        type: 'list',
        tokens: e.tokens.map(t => processPrecedence(t, precedence))
      };
    case 'operator':
      const output: BExpr[] = [processPrecedence(e.tokens[0], precedence)];
      const operators: Operator[] = [];

      getRest(e.tokens).forEach(operand => {
        const operator = operand.operator;
        const token = processPrecedence(operand.token, precedence)
        while (operators.length > 0) {
          const lastOperator = getLast(operators);
          if (precedence[lastOperator].precedence > precedence[operator].precedence
              || (precedence[lastOperator].precedence === precedence[operator].precedence
            && precedence[operator].associativity === 'left')) {
            const rhs = output.pop()!;
            const lhs = output.pop()!;
            const operator = operators.pop()!;
            output.push({
              type: 'binary',
              operator: operator,
              lhs: lhs,
              rhs: rhs
            });
          } else {
            break;
          }
        }
        output.push(token);
        operators.push(operator);
        // push it onto the operator stack.
        // output = appendToken(output, operator, token);
      });
      while (operators.length > 0) {
        const rhs = output.pop()!;
        const lhs = output.pop()!;
        const operator = operators.pop()!;
        output.push({ type: 'binary', operator, lhs, rhs });
      }
      if (output.length !== 1) throw 'error';
      return output[0];
    case 'parens':
      return processPrecedence(e.expr, precedence);
  }
}

export const expr = exprDel.wrappedBy(whitespace).lookahead(Read.eof())
  .map(e => processPrecedence(e, {
    'or': {precedence: 1, associativity: 'left'},
    'and': {precedence: 2, associativity: 'left'},
    '=': {precedence: 3, associativity: 'left'},
    '<=': {precedence: 3, associativity: 'left'},
    '>=': {precedence: 3, associativity: 'left'},
    '<': {precedence: 3, associativity: 'left'},
    '>': {precedence: 3, associativity: 'left'},
    'in': {precedence: 3, associativity: 'left'},
    '+': {precedence: 4, associativity: 'left'},
    '-': {precedence: 4, associativity: 'left'},
    '*': {precedence: 5, associativity: 'left'},
    '/': {precedence: 5, associativity: 'left'},
    '^': {precedence: 6, associativity: 'right'}
  }));

console.log(JSON.stringify(expr.read('yyz', 0)));
console.log(JSON.stringify(expr.read('    x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x <= 5 and (y >= 3 and y < 5) or z in (1, 2, 3)', 0)));
