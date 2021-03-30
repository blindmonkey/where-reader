import { describe, it } from 'mocha';
import { expect } from 'chai';

import { ReadResult } from '../../src/read/ReadResult';

const token = ReadResult.token('x', { position: 1, length: 1, next: 2 });
const failure = ReadResult.failure(ReadResult.error('xyz', 1));

describe('ReadResult.isSuccess', function() {
  it('should be true for token', function() {
    expect(ReadResult.isSuccess(token)).to.be.true;
  });
  it('should be false for failure', function() {
    expect(ReadResult.isSuccess(failure)).to.be.false;
  });
});

describe('ReadResult.isFailure', function() {
  it('should be true for failure', function() {
    expect(ReadResult.isFailure(token)).to.be.false;
  });
  it('should be false for token', function() {
    expect(ReadResult.isFailure(failure)).to.be.true;
  });
});