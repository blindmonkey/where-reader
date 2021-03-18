import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';

describe('EitherReader', function() {
  const reader = Read.char('a').or(Read.char('b'));
  it('has the correct label', function() {
    expect(reader.label).to.be.equal("'a' | 'b'");
  })
  it('succeeds when Left succeeds', function() {
    expect(reader.read('xa', 1))
      .to.be.deep.equal({
        type: 'token',
        value: 'a',
        position: 1,
        length: 1,
        next: 2,
        errors: []
      });
  });
  it('succeeds when Right succeeds', function() {
    expect(reader.read('xb', 1))
      .to.be.deep.equal({
        type: 'token',
        value: 'b',
        position: 1,
        length: 1,
        next: 2,
        errors: []
      });
  });
  it('fails when both Left and Right fail', function() {
    expect(reader.read('xc', 1))
      .to.be.deep.equal({
        type: 'failure',
        errors: [{
          expected: "'a'",
          position: 1,
          context: []
        }, {
          expected: "'b'",
          position: 1,
          context: []
        }]
      });
  });
});