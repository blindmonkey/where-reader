import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';

describe('IgnoresFailuresReader', function() {
  const reader = Read.char('x').then(Read.char('y').repeated()).ignoringSuccessFailures();
  it('passes through label', function() {
    expect(reader.label).to.equal("'x' [...'y']");
  });
  it('passes through failure', function() {
    expect(reader.read('zz', 0))
      .to.deep.equal({
        type: 'failure',
        errors: [{
          expected: "'x'",
          position: 0,
          context: []
        }]
      });
  });
  it('ignores success failures', function() {
    expect(reader.read('xz', 0))
      .to.deep.equal({
        type: 'token',
        value: [{
          type: 'token',
          value: 'x',
          position: 0,
          length: 1,
          next: 1,
          errors: []
        }, {
          type: 'token',
          value: [],
          position: 1,
          length: 0,
          next: 1,
          errors: [{
            expected: "'y'",
            position: 1,
            context: []
          }]
        }],
        position: 0,
        length: 1,
        next: 1,
        errors: []
      });
  });
});