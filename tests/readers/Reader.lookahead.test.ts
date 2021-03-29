import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.lookahead', function() {
  const reader = Read.char('x').lookahead(Read.char('y'));
  it('is labeled correctly', function() {
    expect(reader.label).to.be.equal("'x' 'y'");
  });
  it('reads successfully', function() {
    expect(reader.read('abcxyz', 3))
      .to.be.deep.equal(ReadResult.token('x', {
        position: 3,
        length: 1,
        next: 4
      }));
  });
  it('fails when first fails', function() {
    expect(reader.read('abcayz', 3))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 3)));
  });
  it('fails when second fails', function() {
    expect(reader.read('abcxaz', 3))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'y'", 4)));
  });
});