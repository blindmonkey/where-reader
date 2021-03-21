import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';

describe('EOFReader', function() {
  it('succeeds on exact end of string', function() {
    expect(Read.eof().read('', 0))
      .to.be.deep.equal({
        type: 'token',
        value: null,
        position: 0,
        length: 0,
        next: 0,
        errors: []
      });
  });
  it('succeeds past end of string', function() {
    expect(Read.eof().read('', 5))
      .to.be.deep.equal({
        type: 'token',
        value: null,
        position: 5,
        length: 0,
        next: 5,
        errors: []
      });
  });
  it('fails when there is more to read', function() {
    expect(Read.eof().read('abc', 0))
      .to.be.deep.equal({
        type: 'failure',
        errors: [{
          expected: '<EOF>',
          position: 0,
          context: []
        }]
      });
  });
});