import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Read.regexChar', function() {
  const reader = Read.regexChar(/[a-z]/);
  it('should succeed on matching char', function() {
    expect(reader.read('123abc', 3))
      .to.deep.equal(ReadResult.token('a', {
        position: 3,
        length: 1,
        next: 4
      }));
  });
  it('should fail on EOF', function() {
    expect(reader.read('123abc', 6))
      .to.deep.equal(ReadResult.failure([{
        expected: '/[a-z]/',
        position: 6,
        context: []
      }]));
  });
  it('should fail on non-matching char', function() {
    expect(reader.read('123abc', 2))
      .to.deep.equal(ReadResult.failure([{
        expected: '/[a-z]/',
        position: 2,
        context: []
      }]));
  });
});