import { describe, it } from 'mocha';
import { expect, should } from 'chai';

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
function property<A, B>(expr: A, identifier: B) {
  return { type: 'property', expr: expr, identifier: identifier };
}
function subscript<A, B>(value: A, property: B) {
  return { type: 'subscript', value, property };
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
    expect(expr.read('x.y.z <= 5 and y[1][2].z >= 3 or z in (1, 2, 3)', 0)?.value)
      .to.deep.equal(binary('or',
        binary('and',
          binary('<=',
            property(
              property(identifier('x'), identifier('y')),
              identifier('z')),
            number('5')),
          binary('>=',
            property(
              subscript(
                subscript(identifier('y'), number('1')),
                number('2')),
              identifier('z')),
            number('3'))
        ),
        binary('in',
          identifier('z'),
          list(
            number('1'),
            number('2'),
            number('3')
          )
        )
        ));
  });

  it('mathematical precedence/associativity', function() {
    const id = identifier;
    expect(expr.read('a+b+c+d*e*f*g*h^i^j^k^l*m*n*o*p+q+r+s+t', 0)?.value)
      .to.deep.equal(
        binary('+',
          binary('+',
            binary('+',
              binary('+',
                binary('+',
                  binary('+',
                    binary('+', id('a'), id('b')),
                    id('c')),
                  binary('*',
                    binary('*',
                      binary('*',
                        binary('*',
                          binary('*',
                            binary('*',
                              binary('*',
                                binary('*', id('d'), id('e')),
                                id('f')),
                              id('g')),
                            binary('^',
                              id('h'),
                              binary('^',
                                id('i'),
                                binary('^',
                                  id('j'),
                                  binary('^', id('k'), id('l')))))),
                          id('m')),
                        id('n')),
                      id('o')),
                    id('p'))),
                id('q')),
              id('r')),
            id('s')),
          id('t'))
      );
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