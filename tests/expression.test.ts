import { describe, it } from 'mocha';
import { expect } from 'chai';

import { expr } from '../src/languages/where-language/readers/expression';
import { Reader } from '../src/read/Reader';
import { ReadFailure } from '../src/read/ReadResult';

function deduplicate(arr: string[]): string[] {
  const sentinel = {};
  const seen: { [k: string]: {} } = {};
  const result: string[] = [];
  arr.forEach(item => {
    if (seen[item] !== sentinel) {
      result.push(item);
      seen[item] = sentinel;
    }
  });
  return result;
}
function read<T>(reader: Reader<T>, string: string, withContext: boolean = true) {
  function processFailure(failure: ReadFailure) {
    const byPosition: { [position : number]: {
      position: number,
      expected: string[]
    } } = {};
    failure.errors.forEach(error => {
      if (!Object.prototype.hasOwnProperty.call(byPosition, error.position)) {
        byPosition[error.position] = {
          position: error.position,
          expected: []
        };
      }
      byPosition[error.position].expected
        .push(error.expected);
    });
    return {
      errors: Object.keys(byPosition).flatMap(key => {
        const value = byPosition[key as any as number];
        return {
          position: value.position,
          expected: deduplicate(value.expected).join(' | ')
        };
      })
    };
  }
  function processFailureWithContext(failure: ReadFailure) {
    function contextKey(context: {label: string, position: number}[]): string {
      return context.map(c => `${c.label}:${c.position}`).join(' > ');
    }
    const byPosition: { [position : number]: {
      position: number,
      byContext: { [context: string]: {
        context: {label: string, position: number}[],
        expected: string[]
      } }
    } } = {};
    failure.errors.forEach(error => {
      if (!Object.prototype.hasOwnProperty.call(byPosition, error.position)) {
        byPosition[error.position] = {
          position: error.position,
          byContext: {}
        };
      }
      const byContext = byPosition[error.position].byContext;
      const context = contextKey(error.context);
      if (!Object.prototype.hasOwnProperty.call(byContext, context)) {
        byContext[context] = {
          context: error.context,
          expected: []
        };
      }
      byContext[context].expected.push(error.expected);
    });
    return {
      errors: Object.keys(byPosition).flatMap(positionKey => {
        const position = byPosition[positionKey as any as number];
        return Object.keys(position.byContext).map(contextKey => ({
          position: position.position,
          context: contextKey,
          expected: position.byContext[contextKey].expected.join(' | ')
        }));
      })
    };
  }
  const result = reader.read(string, 0);
  if (result.type === 'failure') {
    if (withContext) {
      return processFailureWithContext(result);
    } else {
      return processFailure(result);
    }
  }
  return result.value;
}
function identifier(identifier: string, position: number, length: number) {
  return { type: 'identifier', identifier, position, length };
}
function number(value: string, position: number = 0, length: number = 0) {
  return { type: 'number', value, position, length };
}
function binary<Op extends string, LHS, RHS>(operator: Op, lhs: LHS, rhs: RHS) {
  return { type: 'binary', operator, lhs, rhs };
}
function list(...tokens: any[]) {
  return { type: 'list', tokens };
}
function property<A, B>(expr: A, identifier: B) {
  return { type: 'property', expr: expr, identifier: identifier };
}
function subscript<A, B>(value: A, property: B) {
  return { type: 'subscript', value, property };
}

describe('expression', function() {
  it('bad identifier', function() {
    expect(read(expr, '12x'))
      .to.deep.equal({
        errors: [{
          position: 2,
          expected: "'.' | '[' | operator",
          context: 'expression:0'
        }, {
          position: 2,
          expected: "<EOF>",
          context: ''
        }]
      });
  })

  it('expression errors', function() {
    expect(read(expr, '1 +'))
      .to.deep.equal({
        errors: [{
          position: 2,
          expected: "'.' | '['",
          context: 'expression:0'
        }, {
          position: 2,
          expected: "<EOF>",
          context: ''
        }, {
          position: 3,
          expected: "identifier | number literal",
          context: 'expression:0 > expression:3 > literal:3'
        }, {
          position: 3,
          expected: "'('",
          context: 'expression:0 > expression:3'
        }, {
          position: 3,
          expected: "'('",
          context: 'expression:0 > expression:3 > list:3'
        }]
      });
    expect(read(expr, '(1 + 2'))
      .to.deep.equal({
        errors: [{
          position: 0,
          expected: "identifier | number literal",
          context: 'expression:0 > literal:0'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > expression:1'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > list:0 > expression:1'
        }, {
          position: 6,
          expected: "'.' | '[' | operator",
          context: 'expression:0 > expression:1 > expression:5'
        }, {
          position: 6,
          expected: "')'",
          context: 'expression:0'
        }, {
          position: 6,
          expected: "'.' | '[' | operator",
          context: 'expression:0 > list:0 > expression:1 > expression:5'
        }, {
          position: 6,
          expected: "',' | ')'",
          context: 'expression:0 > list:0'
        }]
      });
    expect(read(expr, '(1 + )'))
      .to.deep.equal({
        errors: [{
          position: 0,
          expected: 'identifier | number literal',
          context: 'expression:0 > literal:0'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > expression:1'
        }, {
          position: 3,
          expected: "')'",
          context: 'expression:0'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > list:0 > expression:1'
        }, {
          position: 3,
          expected: "',' | ')'",
          context: 'expression:0 > list:0'
        }, {
          position: 5,
          expected: "identifier | number literal",
          context: 'expression:0 > expression:1 > expression:5 > literal:5'
        }, {
          position: 5,
          expected: "'('",
          context: 'expression:0 > expression:1 > expression:5'
        }, {
          position: 5,
          expected: "'('",
          context: 'expression:0 > expression:1 > expression:5 > list:5'
        }, {
          position: 5,
          expected: "identifier | number literal",
          context: 'expression:0 > list:0 > expression:1 > expression:5 > literal:5'
        }, {
          position: 5,
          expected: "'('",
          context: 'expression:0 > list:0 > expression:1 > expression:5'
        }, {
          position: 5,
          expected: "'('",
          context: 'expression:0 > list:0 > expression:1 > expression:5 > list:5'
        }]
      });

    expect(read(expr, '(1 + abc[12)'))
      .to.deep.equal({
        errors: [{
          position: 0,
          expected: "identifier | number literal",
          context: 'expression:0 > literal:0'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > expression:1'
        }, {
          position: 3,
          expected: "'.' | '['",
          context: 'expression:0 > list:0 > expression:1'
        }, {
          position: 8,
          expected: "'.' | operator",
          context: 'expression:0 > expression:1 > expression:5'
        }, {
          position: 8,
          expected: "')'",
          context: 'expression:0'
        }, {
          position: 8,
          expected: "'.' | operator",
          context: 'expression:0 > list:0 > expression:1 > expression:5'
        }, {
          position: 8,
          expected: "',' | ')'",
          context: 'expression:0 > list:0'
        }, {
          position: 11,
          expected: "'.' | '[' | operator",
          context: 'expression:0 > expression:1 > expression:5 > expression:9'
        }, {
          position: 11,
          expected: "']'",
          context: 'expression:0 > expression:1 > expression:5'
        }, {
          position: 11,
          expected: "'.' | '[' | operator",
          context: 'expression:0 > list:0 > expression:1 > expression:5 > expression:9'
        }, {
          position: 11,
          expected: "']'",
          context: 'expression:0 > list:0 > expression:1 > expression:5'
        }]
      })
  });

  it('valid identifier', function() {
    expect(read(expr, 'x'))
      .to.deep.equal(identifier('x', 0, 1));

    expect(read(expr, 'x12'))
      .to.deep.equal(identifier('x12', 0, 3));

    expect(read(expr, 'yyz'))
      .to.deep.equal(identifier('yyz', 0, 3));
  });

  it('number', function() {
    expect(read(expr, '1'))
      .to.deep.equal(number('1', 0, 1));
    expect(read(expr, '123'))
      .to.deep.equal(number('123', 0, 3));
  });

  it('single condition', function() {
    expect(read(expr, 'x = 5'))
      .to.deep.equal(binary('=', identifier('x', 0, 1), number('5', 4, 1)));
  });

  it('nested boolean operator', function() {
    expect(read(expr, 'x = (5 and 3)'))
      .to.deep.equal(binary(
        '=',
        identifier('x', 0, 1),
        binary(
          'and',
          number('5', 5, 1),
          number('3', 11, 1)
        )
      ));
  });

  it('complex expression', function() {
    expect(read(expr, 'x.y.z <= 5 and y[1][2].z >= 3 or z in (1, 2, 3)'))
      .to.deep.equal(binary('or',
        binary('and',
          binary('<=',
            property(
              property(identifier('x', 0, 1), identifier('y', 2, 1)),
              identifier('z', 4, 1)),
            number('5', 9, 1)),
          binary('>=',
            property(
              subscript(
                subscript(identifier('y', 15, 1), number('1', 17, 1)),
                number('2', 20, 1)),
              identifier('z', 23, 1)),
            number('3', 28, 1))
        ),
        binary('in',
          identifier('z', 33, 1),
          list(
            number('1', 39, 1),
            number('2', 42, 1),
            number('3', 45, 1)
          )
        )
        ));
  });

  it('mathematical precedence/associativity', function() {
    const id = identifier;
    expect(read(expr, 'a+b+c+d*e*f*g*h^i^j^k^l*m*n*o*p+q+r+s+t'))
      .to.deep.equal(
        binary('+',
          binary('+',
            binary('+',
              binary('+',
                binary('+',
                  binary('+',
                    binary('+', id('a', 0, 1), id('b', 2, 1)),
                    id('c', 4, 1)),
                  binary('*',
                    binary('*',
                      binary('*',
                        binary('*',
                          binary('*',
                            binary('*',
                              binary('*',
                                binary('*', id('d', 6, 1), id('e', 8, 1)),
                                id('f', 10, 1)),
                              id('g', 12, 1)),
                            binary('^',
                              id('h', 14, 1),
                              binary('^',
                                id('i', 16, 1),
                                binary('^',
                                  id('j', 18, 1),
                                  binary('^', id('k', 20, 1), id('l', 22, 1)))))),
                          id('m', 24, 1)),
                        id('n', 26, 1)),
                      id('o', 28, 1)),
                    id('p', 30, 1))),
                id('q', 32, 1)),
              id('r', 34, 1)),
            id('s', 36, 1)),
          id('t', 38, 1))
      );
  });

  it('complex subexpression', function() {
    expect(read(expr, 'x <= 5 and (y >= 3 and y < 5 and x < 3) or z in (1, 2, 3)'))
      .to.deep.equal(
        binary('or',
          binary('and',
            binary('<=',
              identifier('x', 0, 1),
              number('5', 5, 1)),
            binary('and',
              binary('and',
                binary('>=',
                  identifier('y', 12, 1),
                  number('3', 17, 1)),
                binary('<',
                  identifier('y', 23, 1),
                  number('5', 27, 1))),
              binary('<',
                identifier('x', 33, 1),
                number('3', 37, 1)))),
          binary('in',
            identifier('z', 43, 1),
            list(
              number('1', 49, 1),
              number('2', 52, 1),
              number('3', 55, 1))))
      );
  });
});