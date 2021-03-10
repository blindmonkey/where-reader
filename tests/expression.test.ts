import { describe, it } from 'mocha';
import { expect } from 'chai';

import { expr } from '../src/index';

function identifier(identifier: string) {
  return { type: 'identifier', identifier };
}
function number(value: string) {
  return { type: 'number', value };
}
function operand<T>(operator: string, token: T) {
  return { operator, token };
}
function operator(tokens: any[]) {
  return { type: 'operator', tokens };
}
function parens<T>(expr: T) {
  return { type: 'parens', expr };
}
function binary<Op extends string, LHS, RHS>(operator: Op, lhs: LHS, rhs: RHS) {
  return { type: 'binary', operator, lhs, rhs };
}
function list(...tokens: any[]) {
  return { type: 'list', tokens };
}

describe('expression', function() {
  it('identifier', function() {
    expect(expr.read('12x', 0)).to.be.null;

    expect(expr.read('x', 0)?.value)
      .to.deep.equal(identifier('x'));

    expect(expr.read('x12', 0)?.value)
      .to.deep.equal(identifier('x12'));

    expect(expr.read('yyz', 0)?.value)
      .to.deep.equal(identifier('yyz'));
  });

  it('number', function() {
    expect(expr.read('1', 0)?.value)
      .to.deep.equal(number('1'));
    expect(expr.read('123', 0)?.value)
      .to.deep.equal(number('123'));
  });

  it('single condition', function() {
    expect(expr.read('x = 5', 0)?.value)
      .to.deep.equal(binary('=', identifier('x'), number('5')));
  });

  it('nested boolean operator', function() {
    expect(expr.read('x = (5 and 3)', 0)?.value)
      .to.deep.equal(binary(
        '=',
        identifier('x'),
        binary(
          'and',
          number('5'),
          number('3')
        )
      ));
  });

  it('complex expression', function() {
    expect(expr.read('x <= 5 and y >= 3 or z in (1, 2, 3)', 0)?.value)
      .to.deep.equal(binary(
        'or',
        binary(
          'and',
          binary('<=', identifier('x'), number('5')),
          binary('>=', identifier('y'), number('3'))
        ),
        binary(
          'in',
          identifier('z'),
          list(
            number('1'),
            number('2'),
            number('3')
          )
        )
        ));
  });

  it('complex subexpression', function() {
    expect(expr.read('x <= 5 and (y >= 3 and y < 5 and x < 3) or z in (1, 2, 3)', 0)?.value)
      .to.deep.equal(
        binary('or',
          binary('and',
            binary('<=',
              identifier('x'),
              number('5')),
            binary('and',
              binary('and',
                binary('>=',
                  identifier('y'),
                  number('3')),
                binary('<',
                  identifier('y'),
                  number('5'))),
              binary('<',
                identifier('x'),
                number('3')))),
          binary('in',
            identifier('z'),
            list(
              number('1'),
              number('2'),
              number('3'))))
      );
  });
});