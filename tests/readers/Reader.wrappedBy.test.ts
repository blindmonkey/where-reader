import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.wrappedBy', function() {
  const reader = Read.char('x').wrappedBy(Read.char('a'));
  const str = 'ayaxyxaxazzz';
  it('is labeled correctly', function() {
    expect(reader.label).to.be.equal("'a' 'x' 'a'");
  });
  it('fails when start fails', function() {
    expect(reader.read(str, 4))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'a'", 4)));
  });
  it('fails when middle fails', function() {
    expect(reader.read(str, 0))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 1)));
  });
  it('fails when end fails', function() {
    expect(reader.read(str, 2))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'a'", 4)));
  });
  it('succeeds', function() {
    expect(reader.read(str, 6))
      .to.be.deep.equal(ReadResult.token('x', {
        position: 7, length: 1, next: 9
      }));
  });
});