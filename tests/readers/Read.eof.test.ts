import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.eof', function() {
  it('succeeds on exact end of string', function() {
    expect(Read.eof().read('', 0))
      .to.be.deep.equal(ReadResult.token(null, {
        position: 0,
        length: 0,
        next: 0
      }));
  });
  it('succeeds past end of string', function() {
    expect(Read.eof().read('', 5))
      .to.be.deep.equal(ReadResult.token(null, {
        position: 5,
        length: 0,
        next: 5
      }));
  });
  it('fails when there is more to read', function() {
    expect(Read.eof().read('abc', 0))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error('<EOF>', 0)));
  });
});