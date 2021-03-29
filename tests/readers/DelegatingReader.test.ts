import { describe, it } from "mocha";
import { expect } from "chai";

import { Read } from "../../src/read/Read";
import { ReadResult } from "../../src/read/ReadResult";
import { DelegatingReader } from "../../src/read/readers/DelegatingReader";

describe('DelegatingReader', function() {
  const fnreader = new DelegatingReader(
    (str, position) => ReadResult.failure(ReadResult.error(str, position)),
    '<label>');
  const fnreaderfn = new DelegatingReader(
    null as any, // The function is never called for this reader.
    () => '<label>');
  const reader = new DelegatingReader(Read.char('x'));
  it('should label correctly with string label', function() {
    expect(fnreader.label).to.be.equal('<label>');
  });
  it('should label correctly with function label', function() {
    expect(fnreaderfn.label).to.be.equal('<label>');
  });
  it('should label correctly with reader delegate', function() {
    expect(reader.label).to.be.equal("'x'");
  });
  it('should throw without any arguments', function() {
    expect(() => new DelegatingReader().read('abcdef', 1))
      .to.throw('No delegating reader specified');
  });
  it('should support specifying a delegating function', function() {
    expect(fnreader.read('abc', 1))
      .to.deep.equal(ReadResult.failure(ReadResult.error('abc', 1)));
  });
  it('should fail when delegate reader fails', function() {
    expect(reader.read('abc', 1))
      .to.deep.equal(ReadResult.failure(ReadResult.error("'x'", 1)));
  });
  it('should succeed when delegate reader succeeds', function() {
    expect(reader.read('abcxyz', 3))
      .to.deep.equal(ReadResult.token('x', {
        position: 3, length: 1, next: 4
      }));
  });
  it('should support setting to delegate reader', function() {
    const reader = new DelegatingReader<'x'>();
    reader.setDelegate(Read.char('x', false))
    expect(reader.read('X', 0))
      .to.deep.equal(ReadResult.token('x', {
        position: 0, length: 1, next: 1
      }));
  });
  it('should support setting to delegate function', function() {
    const reader = new DelegatingReader<'x'>();
    reader.setDelegate((str, pos) => ReadResult.token('x', {
      position: pos, length: 1, next: pos + 1
    }), 'lbl');
    expect(reader.label).to.be.equal('lbl');
    expect(reader.read('A', 0))
      .to.deep.equal(ReadResult.token('x', {
        position: 0, length: 1, next: 1
      }));
  });
});