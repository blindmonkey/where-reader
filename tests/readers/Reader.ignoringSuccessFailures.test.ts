import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.ignoringSuccessFailures', function() {
  const reader = Read.char('x').then(Read.char('y').repeated()).ignoringSuccessFailures();
  it('passes through label', function() {
    expect(reader.label).to.equal("'x' [* 'y']");
  });
  it('passes through failure', function() {
    expect(reader.read('zz', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error("'x'", 0)));
  });
  it('ignores success failures', function() {
    expect(reader.read('xz', 0))
      .to.deep.equal(ReadResult.token([
        ReadResult.token('x', {
          position: 0,
          length: 1,
          next: 1
        }),
        ReadResult.token([], {
          position: 1,
          length: 0,
          next: 1,
          errors: [ReadResult.error("'y'", 1)]
        })
      ], {
        position: 0,
        length: 1,
        next: 1
      }));
  });
});