import { describe, it } from 'mocha';
import { expect, should } from 'chai';

import { expr } from '../src/index';

function identifier(id: string) {
  return {
    type: 'identifier',
    identifier: id
  };
}
function number(n: string) {
  return {
    type: 'number',
    value: n
  };
}
function operand<T>(op: string, token: T) {
  return {
    operator: op,
    token: token
  };
}
function operator(lst: any[]) {
  return {
    type: 'operator',
    tokens: lst
  };
}
function parens<T>(x: T) {
  return {
    type: 'parens',
    expr: x
  };
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
      .to.deep.equal(operator([
        identifier('x'),
        operand('=', number('5'))
      ]));
  });

  it('nested boolean operator', function() {
    expect(expr.read('x = (5 and 3)', 0)?.value).to.deep.equal({
      type: 'operator',
      tokens: [
        identifier('x'),
        operand('=', parens(operator([
          number('5'),
          operand('and', number('3'))
        ])))
      ]
    });
  });

  it('complex expression', function() {
    expect(expr.read('x <= 5 and y >= 3 or z in (1, 2, 3)', 0)?.value).to.deep.equal({
      type: 'operator',
      tokens: [
        identifier('x'),
        operand('<=', number('5')),
        operand('and', identifier('y')),
        operand('>=', number('3')),
        operand('or', identifier('z')),
        operand('in', {
          type: 'list',
          tokens: [
            number('1'),
            number('2'),
            number('3')
          ]
        })
      ]
    });
  });

  it('complex subexpression', function() {
    expect(expr.read('x <= 5 and (y >= 3 and y < 5) or z in (1, 2, 3)', 0)?.value).to.deep.equal({
      type: 'operator',
      tokens: [
        identifier('x'),
        operand('<=', number('5')),
        operand('and', parens(operator([
          identifier('y'),
          operand('>=', number('3')),
          operand('and', identifier('y')),
          operand('<', number('5'))
        ]))),
        operand('or', identifier('z')),
        operand('in', {
          type: 'list',
          tokens: [
            number('1'),
            number('2'),
            number('3')
          ]
        })
      ]
    });
  });
});