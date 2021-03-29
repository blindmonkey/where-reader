import { describe, it } from "mocha";
import { expect } from "chai";

import { Read } from "../../src/read/Read";
import { ReadResult } from "../../src/read/ReadResult";

describe('CharReader', function() {
  it('throws on multiple characters', function() {
    expect(() => Read.char('hello'))
      .to.throw('Read.char can only read one character at a time');
  });
  it('fails on end of string', function() {
    expect(Read.char('x').read('x', 1))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 1)));
  });
  it('fails on incorrect character (case sensitive)', function() {
    expect(Read.char('x', true).read('y', 0))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 0)));
  });
  it('fails on incorrect case', function() {
    expect(Read.char('x', true).read('X', 0))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 0)));
  });
  it('fails on incorrect character (case insensitive)', function() {
    expect(Read.char('x', false).read('y', 0))
      .to.be.deep.equal(ReadResult.failure(ReadResult.error("'x'", 0)));
  });
  it('succeeds on correct character (case sensitive)', function() {
    expect(Read.char('c', true).read('abc', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
  });
  it('succeeds on correct character (case insensitive)', function() {
    expect(Read.char('c', false).read('abc', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
    expect(Read.char('c', false).read('abC', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
  })
});