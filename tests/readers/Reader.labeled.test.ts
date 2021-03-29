import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.labeled', function() {
  const base = Read.char('x').then(Read.char('y').repeated());
  const reader = base.labeled('token x', {relabel: false, context: false});
  const relabel = base.labeled('token x', {relabel: true});
  const recontext = base.labeled('token x', {context: true});
  it('default behavior', function() {
    expect(base.labeled('token x').read('z', 0))
      .to.deep.equal(ReadResult.failure([{
        expected: "'x'",
        position: 0,
        context: [{label: 'token x', position: 0}]
      }]));
  });
  it('relabels failure', function() {
    expect(relabel.read('z', 0))
      .to.deep.equal(ReadResult.failure([{
        expected: 'token x',
        position: 0,
        context: []
      }]));
  });
  it('adds context to failures', function() {
    expect(recontext.read('z', 0))
      .to.deep.equal(ReadResult.failure([{
        expected: "'x'",
        position: 0,
        context: [{label: 'token x', position: 0}]
      }]));
  });
  it('does nothing to failures with no options', function() {
    expect(reader.read('z', 0))
      .to.deep.equal(ReadResult.failure([{
        expected: "'x'",
        position: 0,
        context: []
      }]));
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
        errors: [{
          expected: "'y'",
          position: 1,
          context: []
        }]
      })], {
        position: 0,
        length: 1,
        next: 1,
        errors: [{
          expected: 'token x',
          position: 0,
          context: []
        }]
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
          errors: [{
            expected: "'y'",
            position: 1,
            context: []
          }]
        })
      ], {
        position: 0,
        length: 1,
        next: 1,
        errors: [{
          expected: "'y'",
          position: 1,
          context: [{ label: 'token x', position: 0 }]
        }]
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
          errors: [{
            expected: "'y'",
            position: 1,
            context: []
          }]
        })
      ], {
        position: 0,
        length: 1,
        next: 1,
        errors: [{
          expected: "'y'",
          position: 1,
          context: []
        }]
      }));
  });
});