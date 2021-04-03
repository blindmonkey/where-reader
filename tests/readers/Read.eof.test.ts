import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';
import { read, errors, error } from '../read-helpers';

describe('Read.eof', function() {
  it('succeeds on exact end of string', function() {
    expect(read(Read.eof(), '', 0))
      .to.be.deep.equal(ReadResult.token(null, {
        position: 0,
        length: 0,
        next: 0
      }));
  });
  it('succeeds past end of string', function() {
    expect(read(Read.eof(), '', 5))
      .to.be.deep.equal(ReadResult.token(null, {
        position: 5,
        length: 0,
        next: 5
      }));
  });
  it('fails when there is more to read', function() {
    expect(read(Read.eof(), 'abc', 0))
      .to.be.deep.equal(errors(error('<EOF>', 0)));
  });
});