import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.or', function() {
  const reader = Read.char('a').or(Read.char('b'));
  it('has the correct label', function() {
    expect(reader.label).to.be.equal("'a' | 'b'");
  })
  it('succeeds when Left succeeds', function() {
    expect(reader.read('xa', 1))
      .to.be.deep.equal(ReadResult.token('a', {
        position: 1,
        length: 1,
        next: 2
      }));
  });
  it('succeeds when Right succeeds', function() {
    expect(reader.read('xb', 1))
      .to.be.deep.equal(ReadResult.token('b', {
        position: 1,
        length: 1,
        next: 2
      }));
  });
  it('fails when both Left and Right fail', function() {
    expect(reader.read('xc', 1))
      .to.be.deep.equal(ReadResult.failure(
        ReadResult.error("'a'", 1),
        ReadResult.error("'b'", 1)));
  });
});