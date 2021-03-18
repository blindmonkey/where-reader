interface TokenPosition {
  position: number;
  length: number;
}
export interface IToken<Type extends string> {
  type: Type;
}
export interface WhitespaceToken extends IToken<'whitespace'> {
  content: string;
}
export interface IdentifierToken extends IToken<'identifier'>, TokenPosition {
  identifier: string;
}
export interface NumberLiteral extends IToken<'number'>, TokenPosition {
  value: string;
}
export type MathOperator = '+' | '-' | '*' | '/' | '^';
export type EqualityOperator = '=' | '<=' | '>=' | '<' | '>';
export type BooleanOperator = 'and' | 'or';
export type Operator = 'in' | EqualityOperator | MathOperator | BooleanOperator;
export function isEqualityOperator(op: Operator): op is EqualityOperator {
  switch (op) {
    case '=':
    case '<=':
    case '>=':
    case '<':
    case '>':
      return true;
    default:
      return false;
  }
}
export function isMathOperator(op: Operator): op is MathOperator {
  switch (op) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '^':
      return true;
    default:
      return false
  }
}
export type Literal = NumberLiteral | IdentifierToken;
export type Expr = Literal | List<Expr> | ParenExpression<Expr> | OperatorTokens | PropertyAccess<Expr> | SubscriptAccess<Expr>;
export interface List<Expr> extends IToken<'list'> {
  tokens: Expr[];
}
export interface RHSOperand {
  operator: Operator;
  token: Expr;
}
export interface OperatorTokens extends IToken<'operator'> {
  tokens: [Expr, ...RHSOperand[]]
}
export interface ParenExpression<Expr> extends IToken<'parens'> {
  expr: Expr;
}
export interface PropertyAccess<Expr> extends IToken<'property'> {
  expr: Expr;
  identifier: IdentifierToken;
}
export interface SubscriptAccess<Expr> extends IToken<'subscript'> {
  value: Expr;
  property: Expr;
}

export interface Binary extends IToken<'binary'> {
  operator: Operator;
  lhs: BExpr;
  rhs: BExpr;
}
export type BExpr = Literal | List<BExpr> | Binary | PropertyAccess<BExpr> | SubscriptAccess<BExpr>;
