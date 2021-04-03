import { describe, it } from "mocha";
import { expect } from "chai";

import { Read } from "../../src/read/Read";
import { ReadResult } from "../../src/read/ReadResult";
import { read, errors, error } from "../read-helpers";

describe('Read.char', function() {
  it('throws on multiple characters', function() {
    expect(() => Read.char('hello'))
      .to.throw('Read.char can only read one character at a time');
  });
  it('fails on end of string', function() {
    expect(read(Read.char('x'), 'x', 1))
      .to.be.deep.equal(errors(error("'x'", 1)));
  });
  it('fails on incorrect character (case sensitive)', function() {
    expect(read(Read.char('x', true), 'y', 0))
      .to.be.deep.equal(errors(error("'x'", 0)));
  });
  it('fails on incorrect case', function() {
    expect(read(Read.char('x', true), 'X', 0))
      .to.be.deep.equal(errors(error("'x'", 0)));
  });
  it('fails on incorrect character (case insensitive)', function() {
    expect(read(Read.char('x', false), 'y', 0))
      .to.be.deep.equal(errors(error("'x'", 0)));
  });
  it('succeeds on correct character (case sensitive)', function() {
    expect(read(Read.char('c', true), 'abc', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
  });
  it('succeeds on correct character (case insensitive)', function() {
    expect(read(Read.char('c', false), 'abc', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
    expect(read(Read.char('c', false), 'abC', 2))
      .to.be.deep.equal(ReadResult.token('c', {
        position: 2,
        length: 1,
        next: 3
      }));
  })
});