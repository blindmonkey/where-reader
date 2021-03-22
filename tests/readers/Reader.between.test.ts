import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';

describe('Reader.between', function() {
  const reader = Read.char('x').between(Read.char('('), Read.char(')'));
  const str = 'a(b)(x)(xx'
  it('has the correct label', function() {
    expect(reader.label).to.be.equal("'(' 'x' ')'");
  });
  it('reads a match', function() {
    expect(reader.read(str, 4))
      .to.be.deep.equal({
        type: 'token',
        value: 'x',
        position: 5,
        length: 1,
        next: 7,
        errors: []
      });
  })
  it('fails on left fail', function() {
    expect(reader.read(str, 2))
      .to.be.deep.equal({
        type: 'failure',
        errors: [{
          expected: "'('",
          position: 2,
          context: []
        }]
      });
  });
  it('fails on middle fail', function() {
    expect(reader.read(str, 1))
      .to.be.deep.equal({
        type: 'failure',
        errors: [{
          expected: "'x'",
          position: 2,
          context: []
        }]
      });
  });
  it('fails on right fail', function() {
    expect(reader.read(str, 7))
      .to.be.deep.equal({
        type: 'failure',
        errors: [{
          expected: "')'",
          position: 9,
          context: []
        }]
      });
  });
});