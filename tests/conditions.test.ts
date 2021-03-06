import { describe, it } from 'mocha';
import { expect } from 'chai';

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

describe('expression', function() {
  it('single condition', function() {
    expect(expr.read('x = 5', 0)?.value).to.deep.equal({
      type: 'eq-condition',
      operator: '=',
      lhs: identifier('x'),
      rhs: number('5')
    });
  });

  it('complex expression', function() {
    expect(expr.read('x <= 5 and y >= 3 or z in (1, 2, 3)', 0)?.value).to.deep.equal({
      type: 'ors',
      tokens: [
        {
          type: 'ands',
          tokens: [
            {
              type: 'eq-condition',
              operator: '<=',
              lhs: identifier('x'),
              rhs: number('5')
            },
            {
              type: 'eq-condition',
              operator: '>=',
              lhs: identifier('y'),
              rhs: number('3')
            }
          ]
        },
        {
          type: 'in-condition',
          lhs: identifier('z'),
          rhs: {
            type: 'literal-list',
            literals: [
              number('1'),
              number('2'),
              number('3')
            ]
          }
        }
      ]
    });
  });
});