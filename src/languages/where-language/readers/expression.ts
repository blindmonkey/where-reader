import { Read } from "../../../read/Read";
import { Reader } from "../../../read/Reader";
import { DelegatingReader } from "../../../read/readers/DelegatingReader";
import { ReadToken } from "../../../read/ReadResult";
import { BExpr, Expr, IdentifierToken, List, Literal, Operator, OperatorTokens, ParenExpression, PropertyAccess, SubscriptAccess } from "../tokens";
import { operator } from "./operators";
import { identifier, literal, whitespace } from "./primitives";
import { closeBracket, closeParen, comma, openBracket, openParen } from "./symbols";

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

const exprDel = new DelegatingReader<Expr>()
  .labeled('expression');

const list: Reader<List<Expr>> = exprDel
  .separatedBy(comma.wrappedBy(whitespace))
  .between(openParen.wrappedBy(whitespace), closeParen.wrappedBy(whitespace))
  .labeled('list')
  // TODO: Preserve position information of the tokens
  .map(tokens => ({type: 'list', tokens: tokens.map(t => t.value)}));

const parenExpr: Reader<ParenExpression<Expr>> = exprDel.between(openParen.wrappedBy(whitespace), closeParen.wrappedBy(whitespace))
  .map(tokens => ({
    type: 'parens',
    expr: tokens
  }));

const exprLHS: Reader<Literal | ParenExpression<Expr> | List<Expr> | PropertyAccess<Expr> | SubscriptAccess<Expr>> =
  literal.or(parenExpr).or(list)
  .then(
    Read.char('.').wrappedBy(whitespace).then(identifier)
    .map<{type: 'property', identifier: ReadToken<IdentifierToken>}>(tokens => ({
      type: 'property',
      identifier: tokens[1]
    }))
    .or(exprDel.between(openBracket.wrappedBy(whitespace), closeBracket.wrappedBy(whitespace))
      .map<{type: 'subscript', subscript: Expr}>(tokens => ({
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
      for (let i = 0; i < rhs.length; i++) {
        const token = rhs[i].value;
        switch (token.type) {
          case 'property':
            root = {
              type: 'property',
              expr: root,
              identifier: token.identifier.value
            };
            break;
          case 'subscript':
            root = {
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
  .labeled('operator-lhs', {context: false});

exprDel.delegate =
  exprLHS
    .then(operator.wrappedBy(whitespace)
      .then(exprDel.labeled('operator-rhs', {context: false})).optional())
    .labeled('operator-list', {context: false})
  .map(tokens => {
    const rest = tokens[1].value;
    if (rest == null) {
      return tokens[0].value;
    } else if (rest[1].value.type === 'operator') {
      const t: OperatorTokens = {
        type: 'operator',
        tokens: prepend(
          tokens[0].value,
          [{
            operator: rest[0].value,
            token: rest[1].value.tokens[0]
          }].concat(getRest(rest[1].value.tokens)))
      };
      return t
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
    case 'string':
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
  }))
  .ignoringSuccessFailures();
