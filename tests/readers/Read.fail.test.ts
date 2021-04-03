import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';
import { read, errors, error } from '../read-helpers';

describe('Read.fail', function() {
  it('supports expected message', function() {
    expect(read(Read.fail('<sentinel>'), 'abc', 1))
      .to.be.deep.equal(errors(error('<sentinel>', 1)));
  });
  it('supports custom fail block', function() {
    expect(read(Read.fail((str, index) => ReadResult.failure(
      ReadResult.error(str.slice(index), index),
      ReadResult.error('<sentinel>', index + 1))),
      'abcdef', 2))
      .to.be.deep.equal(errors(
        error('cdef', 2),
        error('<sentinel>', 3)
      ));
  });
});