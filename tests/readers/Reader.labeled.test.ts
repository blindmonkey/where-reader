import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.labeled', function() {
  const base = Read.char('x').then(Read.char('y').repeated());
  const reader = base.labeled('token x', {relabel: false, context: false, simplify: false});
  const relabel = base.labeled('token x', {relabel: true, simplify: false});
  const recontext = base.labeled('token x', {context: true, simplify: false});
  it('default behavior', function() {
    expect(base.labeled('token x').read('z', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error(
        "token x", 0, [])));
  });
  it('default behavior, no simplify', function() {
    expect(base.labeled('token x', {simplify: false}).read('z', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error(
        "'x'", 0, [{label: 'token x', position: 0}])));
  });
  it('relabels failure', function() {
    expect(relabel.read('z', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error('token x', 0)));
  });
  it('adds context to failures', function() {
    expect(recontext.read('z', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error(
        "'x'", 0, [{label: 'token x', position: 0}])));
  });
  it('does nothing to failures with no options', function() {
    expect(reader.read('z', 0))
      .to.deep.equal(ReadResult.failure(ReadResult.error("'x'", 0)));
  });
  it('relabels success', function() {
    expect(relabel.read('x', 0))
      .to.deep.equal(ReadResult.token([ReadResult.token('x', {
        position: 0,
        length: 1,
        next: 1
      }), ReadResult.token([], {
        position: 1,
        length: 0,
        next: 1,
        errors: [ReadResult.error("'y'", 1)]
      })], {
        position: 0,
        length: 1,
        next: 1,
        errors: [ReadResult.error('token x', 0)]
      }));
  });
  it('adds context to successes', function() {
    expect(recontext.read('x', 0))
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
        next: 1,
        errors: [ReadResult.error(
          "'y'", 1, [{ label: 'token x', position: 0 }])]
      }));
  });
  it('does nothing to successes with no options', function() {
    expect(reader.read('x', 0))
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
        next: 1,
        errors: [ReadResult.error("'y'", 1)]
      }));
  });
});