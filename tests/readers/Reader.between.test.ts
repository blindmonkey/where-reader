import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.between', function() {
  const reader = Read.char('x').between(Read.char('('), Read.char(')'));
  const str = 'a(b)(x)(xx'
  it('has the correct label', function() {
    expect(reader.label).to.be.equal("'(' 'x' ')'");
  });
  it('reads a match', function() {
    expect(reader.read(str, 4))
      .to.be.deep.equal(ReadResult.token('x', {
        position: 5,
        length: 1,
        next: 7
      }));
  })
  it('fails on left fail', function() {
    expect(reader.read(str, 2))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'('", 2)));
  });
  it('fails on middle fail', function() {
    expect(reader.read(str, 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 2)));
  });
  it('fails on right fail', function() {
    expect(reader.read(str, 7))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("')'", 9)));
  });
});