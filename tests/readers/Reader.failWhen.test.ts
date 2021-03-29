import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('FailReader', function() {
  const reader = Read.char('x')
    .then(Read.char('y').repeated())
    .map(tokens => tokens[0].value + tokens[1].value.map(v => v.value).join(''))
    .failWhen(v => v.length < 2);
  it('has a label', function() {
    expect(reader.label).to.be.equal("'x' [...'y'] fails on condition");
  });
  it('can succeed', function() {
    expect(reader.read('zxy', 1))
      .to.deep.equal(ReadResult.token('xy', {
        position: 1,
        length: 2,
        next: 3,
        errors: [ReadResult.error("'y'", 3)]
      }));
  });
  it('passes failure through', function() {
    expect(reader.read('zzxy', 1))
      .to.deep.equal(ReadResult.failure(ReadResult.error("'x'", 1)));
  });
  it('fails on condition', function() {
    expect(reader.read('zx', 1))
      .to.deep.equal(ReadResult.failure(
        ReadResult.error(
          "'x' [...'y'] fails on condition", 1)));
  });
});