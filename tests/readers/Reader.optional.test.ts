import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';

describe('Read.optional', function() {
  const reader = Read.char('x').optional();
  it('has the correct label', function() {
    expect(reader.label).to.be.equal("['x']");
  });
  it('succeeds', function() {
    expect(reader.read('abcx', 3))
      .to.deep.equal({
        type: 'token',
        value: 'x',
        position: 3,
        length: 1,
        next: 4,
        errors: []
      });
  });
  it('fails', function() {
    expect(reader.read('abcx', 2))
      .to.deep.equal({
        type: 'token',
        value: null,
        position: 2,
        length: 0,
        next: 2,
        errors: [{
          expected: "'x'",
          position: 2,
          context: []
        }]
      });
  });
});