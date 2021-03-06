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
type Operator = '=' | '<=' | '>=' | '<' | '>';
type Literal = NumberLiteral | IdentifierToken;
interface LiteralList extends IToken<'literal-list'> {
  literals: Literal[];
}
interface EqualityCondition extends IToken<'eq-condition'> {
  operator: Operator;
  lhs: IdentifierToken;
  rhs: Literal;
}
interface InCondition extends IToken<'in-condition'> {
  lhs: IdentifierToken;
  rhs: LiteralList;
}
type Condition = EqualityCondition | InCondition;
interface OrTokens extends IToken<'ors'> {
  tokens: (AndTokens | OrTokens | Condition)[];
}
interface AndTokens extends IToken<'ands'> {
  tokens: (Condition | OrTokens | AndTokens)[];
}

// type Token = WhitespaceToken | Literal | LiteralList | EqualityCondition | ;

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
const number: Reader<NumberLiteral> =
  Read.regexChar(/\d/).repeated()
  .map((tokens) => tokens.map((token) => token.value).join(''))
  .labeled('number')
  .map(value => ({type: 'number', value: value}));

const literal: Reader<Literal> = identifier.or(number).labeled('literal');
const literalList: Reader<LiteralList> = literal
  .separatedBy(comma.wrappedBy(whitespace))
  .between(openParen, closeParen)
  .labeled('literal-list')
  // TODO: Preserve position information of the tokens
  .map(tokens => ({type: 'literal-list', literals: tokens.map(t => t.value)}));

const equalityOperator: Reader<Operator> =
  Read.literal('=')
  .or(Read.literal('<='))
  .or(Read.literal('>='))
  .or(Read.literal('<'))
  .or(Read.literal('>'))
  .labeled('equality-op');

// TODO: Support literal/literal conditions and complex expressions
const eqCondition: Reader<EqualityCondition> =
  identifier.then(equalityOperator.wrappedBy(whitespace).then(literal))
    .map(tokens => ({
      type: 'eq-condition',
      operator: tokens[1].value[0].value,
      lhs: tokens[0].value,
      rhs: tokens[1].value[1].value
    }));
const inCondition: Reader<InCondition> =
  identifier.then(Read.literal('in', false).wrappedBy(whitespace).then(literalList))
    .map(tokens => ({
      type: 'in-condition',
      lhs: tokens[0].value,
      rhs: tokens[1].value[1].value
    }));
const condition: Reader<EqualityCondition | InCondition> =
  eqCondition.or(inCondition)
  .labeled('condition');

const exprDel = new DelegatingReader<AndTokens | OrTokens | Condition>()
  .labeled('expression');
const ands: Reader<AndTokens | OrTokens | Condition> = condition
  .or(exprDel.between(openParen, closeParen))
  .separatedBy(and.wrappedBy(whitespace))
  .labeled('ands')
  .map(tokens => {
    if (tokens.length === 1) {
      return tokens[0].value;
    }
    return {
      type: 'ands',
      tokens: tokens.map(t => t.value)
    };
  });
const ors: Reader<OrTokens | AndTokens | Condition> = ands
  .or(exprDel.between(openParen, closeParen))
  .separatedBy(or.wrappedBy(whitespace))
  .labeled('ors')
  .map(tokens => {
    if (tokens.length === 1) {
      return tokens[0].value;
    }
    return {
      type: 'ors',
      tokens: tokens.map(t => t.value)
    };
  });

exprDel.delegate = ors;
export const expr = exprDel.then(Read.eof())
  .map(t => t[0].value);

console.log(JSON.stringify(expr.read('x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
