import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.fail', function() {
  it('supports expected message', function() {
    expect(Read.fail('<sentinel>').read('abc', 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error('<sentinel>', 1)));
  });
  it('supports custom fail block', function() {
    expect(Read.fail((str, index) => ReadResult.failure(
      ReadResult.error(str.slice(index), index),
      ReadResult.error('<sentinel>', index + 1)))
      .read('abcdef', 2))
      .to.be.deep.equal(ReadResult.failure(
        ReadResult.error('cdef', 2),
        ReadResult.error('<sentinel>', 3)
      ));
  });
});