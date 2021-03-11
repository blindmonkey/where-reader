import { DelegatingReader } from "./read/readers/DelegatingReader";
import { Read } from "./read/Read";
import { Reader } from "./read/Reader";
import { ReadToken } from "./read/ReadToken";

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
type Expr = Literal | List<Expr> | ParenExpression<Expr> | OperatorTokens | PropertyAccess<Expr> | SubscriptAccess<Expr>;
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
interface PropertyAccess<Expr> extends IToken<'property'> {
  expr: Expr;
  identifier: IdentifierToken;
}
interface SubscriptAccess<Expr> extends IToken<'subscript'> {
  value: Expr;
  property: Expr;
}

interface Binary extends IToken<'binary'> {
  operator: Operator;
  lhs: BExpr;
  rhs: BExpr;
}
type BExpr = Literal | List<BExpr> | Binary | PropertyAccess<BExpr> | SubscriptAccess<BExpr>;

const openParen = Read.char('(').labeled('open-paren');
const closeParen = Read.char(')').labeled('close-paren');
const openBracket = Read.char('[').labeled('open-bracket');
const closeBracket = Read.char(']').labeled('close-bracket');
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

const exprLHS: Reader<Literal | ParenExpression<Expr> | List<Expr> | PropertyAccess<Expr> | SubscriptAccess<Expr>> =
  literal.or(parenExpr).or(list)
  .then(
    Read.char('.').wrappedBy(whitespace).then(identifier)
    .map(tokens => (<{type: 'property', identifier: ReadToken<IdentifierToken>}>{
      type: 'property',
      identifier: tokens[1]
    }))
    .or(exprDel.between(openBracket, closeBracket)
      .map(tokens => (<{type: 'subscript', subscript: Expr}>{
        type: 'subscript',
        subscript: tokens
      })))
    .repeated()
  )
  .map(tokens => {
    if (tokens[1].value.length == 0) {
      return tokens[0].value;
    } else {
      let root: Expr = tokens[0].value;
      const rhs = tokens[1].value;
      // 'a.b.c' => 'a' ['b', 'c']
      // prop(prop('a', 'b'), 'c')
      for (let i = 0; i < rhs.length; i++) {
        // const token = rhs[rhs.length - 1 - i];
        const token = rhs[i].value;
        switch (token.type) {
          case 'property':
            root = <PropertyAccess<Expr>>{
              type: 'property',
              expr: root,
              identifier: token.identifier.value
            };
            break;
          case 'subscript':
            root = <SubscriptAccess<Expr>>{
              type: 'subscript',
              value: root,
              property: token.subscript
            };
            break;
        }
      }
      return root;
    }
  })
  .labeled('operator-lhs');
exprDel.delegate =
  exprLHS
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
    case 'property':
      return {
        type: 'property',
        expr: processPrecedence(e.expr, precedence),
        identifier: e.identifier
      };
    case 'subscript':
      return {
        type: 'subscript',
        value: processPrecedence(e.value, precedence),
        property: processPrecedence(e.property, precedence)
      };
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

function compile(expression: string): string {
  class CompilationContext {
    private id_: number = 0;
    get id(): string {
      const id = this.id_;
      this.id_++;
      return '_' + id;
    }
  }
  function compile(expr: BExpr, context: CompilationContext): {id: string, code: string} {
    const id = context.id;
    function result(expr: string, deps: string = '') {
      return {
        id: id,
        code: `${deps}var ${id} = ${expr};\n`
      };
    }
    switch (expr.type) {
      case 'identifier':
        return result(`context['${expr.identifier}']`);
      case 'number':
        return result(expr.value);
      case 'property':
        const e = compile(expr.expr, context);
        return result(`${e.id}.${expr.identifier.identifier}`, e.code);
      case 'subscript':
        const value = compile(expr.value, context);
        const property = compile(expr.property, context);
        return result(`${value.id}[${property.id}]`, `${value.code}${property.code}`);
      case 'list':
        const tokens = expr.tokens.map(token => compile(token, context));
        return result(`[${tokens.map(t => t.id).join(', ')}]`, tokens.map(t => t.code).join(''));
      case 'binary':
        const lhs = compile(expr.lhs, context);
        const rhs = compile(expr.rhs, context);
        function compileBinary(op: Operator, lhs: string, rhs: string): string {
          switch (op) {
            case '+':
            case '-':
            case '*':
            case '/':
            case '<=':
            case '>=':
            case '<':
            case '>':
              return `${lhs} ${op} ${rhs}`;
            case '=':
              return `${lhs} === ${rhs}`;
            case '^':
              return `Math.pow(${lhs}, ${rhs})`;
            case 'and':
              return `${lhs} && ${rhs}`;
            case 'or':
              return `${lhs} || ${rhs}`;
            case 'in':
            // default:
              throw `Unsupported operator ${op}`;
          }
        }
        return result(`(${compileBinary(expr.operator, lhs.id, rhs.id)})`, `${lhs.code}${rhs.code}`);
      // default:
      //   throw `unsupported ${expr.type}`;
    }
  }
  const parsed = expr.read(expression, 0);
  if (parsed == null) throw 'Parse error';
  const compiled = compile(parsed.value, new CompilationContext());
  return `
function(context) {
${compiled.code}
return ${compiled.id};
}`;
}

console.log(compile('a.b.c[1 + x].d and z = (1, 2, 3 + 4)'));
console.log(JSON.stringify(expr.read('a.b.c[1 + 2].d', 0)));
console.log(JSON.stringify(expr.read('yyz', 0)));
console.log(JSON.stringify(expr.read('    x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x <= 5 and (y >= 3 and y < 5) or z in (1, 2, 3)', 0)));
