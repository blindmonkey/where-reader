import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.nextChar', function() {
  const reader = Read.nextChar();
  function success(position: number, length: number) {
    return ReadResult.token('x', {
      position, length, next: position + length
    });
  }
  it('reads first character', function() {
    expect(reader.read('xyz', 0))
      .to.deep.equal(success(0, 1));
  });
  it('reads non-first character', function() {
    expect(reader.read('abcxyz', 3))
      .to.deep.equal(success(3, 1));
  });
  it('fails on eof', function() {
    expect(reader.read('xyz', 3))
      .to.deep.equal(ReadResult.failure(ReadResult.error('<any char>', 3)));
  });
});
