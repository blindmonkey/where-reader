import { describe, it } from 'mocha';
import { expect } from 'chai';

import { expr } from '../src/languages/where-language/readers/expression';
import { binary, identifier, list, number, property, read, subscript } from './read-helpers';

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
          expected: "identifier | number literal | string literal",
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
          expected: "identifier | number literal | string literal",
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
          expected: 'identifier | number literal | string literal',
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
          expected: "identifier | number literal | string literal",
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
          expected: "identifier | number literal | string literal",
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
          expected: "identifier | number literal | string literal",
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