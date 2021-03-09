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
function operator<T>(op: string, token: T) {
  return {
    operator: op,
    token: token
  }
}

describe('expression', function() {
  it('single condition', function() {
    expect(expr.read('x = 5', 0)?.value).to.deep.equal({
      type: 'operator',
      tokens: [
        identifier('x'),
        operator('=', number('5'))
      ]
    });
  });

  it('complex expression', function() {
    expect(expr.read('x <= 5 and y >= 3 or z in (1, 2, 3)', 0)?.value).to.deep.equal({
      type: 'operator',
      tokens: [
        identifier('x'),
        operator('<=', number('5')),
        operator('and', identifier('y')),
        operator('>=', number('3')),
        operator('or', identifier('z')),
        operator('in', {
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