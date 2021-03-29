import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.literal', function() {
  it('reads empty string', function() {
    expect(Read.literal('').read('axyz', 1))
      .to.deep.equal(ReadResult.token('', {
        position: 1,
        length: 0,
        next: 1
      }));
  });
  it('reads case sensitive', function() {
    expect(Read.literal('xyz', true).read('axyz', 1))
      .to.deep.equal(ReadResult.token('xyz', {
        position: 1,
        length: 3,
        next: 4
      }));
  });
  it('fails case sensitive (and is default)', function() {
    expect(Read.literal('xyz').read('aXYZ', 1))
      .to.deep.equal(ReadResult.failure(ReadResult.error('"xyz"', 1)));
  });
  it('reads case insensitive', function() {
    expect(Read.literal('xyz', false).read('aXYZ', 1))
      .to.deep.equal(ReadResult.token('xyz', {
        position: 1,
        length: 3,
        next: 4
      }));
  });
  it('fails case insensitive', function() {
    expect(Read.literal('xyz', false).read('XYZ', 1))
      .to.deep.equal(ReadResult.failure(ReadResult.error('"xyz"', 1)));
  });
});