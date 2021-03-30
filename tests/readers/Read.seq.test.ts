import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.seq', function() {
  const reader0 = Read.seq();
  const reader1 = Read.seq(Read.char('a'));
  const reader3 = Read.seq(Read.char('a'), Read.char('b'), Read.char('c'));
  it('should have empty when there are no readers', function() {
    expect(reader0.label).to.be.equal('');
  });
  it('should read empty without any readers', function() {
    expect(reader0.read('abc', 1))
      .to.deep.equal(ReadResult.token([], {
        position: 1, length: 0, next: 1
      }));
  });
  it('should have the correct label when there is one reader', function() {
    expect(reader1.label).to.be.equal("'a'");
  });
  it('should read correctly with one reader in sequence', function() {
    expect(reader1.read('xyzabc', 3))
      .to.be.deep.equal(ReadResult.token([
        ReadResult.token('a', {
          position: 3, length: 1, next: 4
        })
      ], { position: 3, length: 1, next: 4 }));
  });
  it('should read correctly with three readers in sequence', function() {
    expect(reader3.read('xyzabc', 3))
      .to.be.deep.equal(ReadResult.token([
        ReadResult.token('a', { position: 3, length: 1, next: 4 }),
        ReadResult.token('b', { position: 4, length: 1, next: 5 }),
        ReadResult.token('c', { position: 5, length: 1, next: 6 }),
      ], { position: 3, length: 3, next: 6 }));
  });
  it('should fail when first reader fails', function() {
    expect(reader3.read('xybcbc', 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'a'", 1)));
  });
  it('should fail when second reader fails', function() {
    expect(reader3.read('xazcbc', 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'b'", 2)));
  });
  it('should fail when third reader fails', function() {
    expect(reader3.read('xabzbc', 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'c'", 3)));
  });
});