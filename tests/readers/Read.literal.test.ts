import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';
import { read, errors, error } from '../read-helpers';

describe('Read.literal', function() {
  it('reads empty string', function() {
    expect(read(Read.literal(''), 'axyz', 1))
      .to.deep.equal(ReadResult.token('', {
        position: 1,
        length: 0,
        next: 1
      }));
  });
  it('reads case sensitive', function() {
    expect(read(Read.literal('xyz', true), 'axyz', 1))
      .to.deep.equal(ReadResult.token('xyz', {
        position: 1,
        length: 3,
        next: 4
      }));
  });
  it('fails case sensitive (and is default)', function() {
    expect(read(Read.literal('xyz'), 'aXYZ', 1))
      .to.deep.equal(errors(error('"xyz"', 1)));
  });
  it('reads case insensitive', function() {
    expect(read(Read.literal('xyz', false), 'aXYZ', 1))
      .to.deep.equal(ReadResult.token('xyz', {
        position: 1,
        length: 3,
        next: 4
      }));
  });
  it('fails case insensitive', function() {
    expect(read(Read.literal('xyz', false), 'XYZ', 1))
      .to.deep.equal(errors(error('"xyz"', 1)));
  });
});