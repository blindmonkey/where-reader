import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';

describe('Reader.repeated', function() {
  const reader = Read.literal('abc').repeated();
  const str = 'abcxyzabcabcabcxyz';
  it('has the correct label', function() {
    expect(reader.label).to.be.equal('[..."abc"]');
  })
  it('reads empty on failure', function() {
    expect(reader.read(str, 2))
      .to.be.deep.equal({
        type: 'token',
        value: [],
        position: 2,
        length: 0,
        next: 2,
        errors: [{
          expected: '"abc"',
          position: 2,
          context: []
        }]
      });
  });
  it('reads one', function() {
    expect(reader.read(str, 0))
      .to.be.deep.equal({
        type: 'token',
        value: [{
          type: 'token',
          value: 'abc',
          position: 0,
          length: 3,
          next: 3,
          errors: []
        }],
        position: 0,
        length: 3,
        next: 3,
        errors: [{
          expected: '"abc"',
          position: 3,
          context: []
        }]
      })
  });
  it('reads multiple', function() {
    expect(reader.read(str, 6))
      .to.be.deep.equal({
        type: 'token',
        value: [{
          type: 'token',
          value: 'abc',
          position: 6,
          length: 3,
          next: 9,
          errors: []
        }, {
          type: 'token',
          value: 'abc',
          position: 9,
          length: 3,
          next: 12,
          errors: []
        }, {
          type: 'token',
          value: 'abc',
          position: 12,
          length: 3,
          next: 15,
          errors: []
        }],
        position: 6,
        length: 9,
        next: 15,
        errors: [{
          expected: '"abc"',
          position: 15,
          context: []
        }]
      })
  });

});