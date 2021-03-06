import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Read } from '../../src/read/Read';
import { ReadResult } from '../../src/read/ReadResult';

describe('Reader.separatedBy', function() {
  const part = Read.regexChar(/[a-z]/).repeated()
    .failWhen(token => token.length < 1)
    .map(tokens => tokens.map(token => token.value).join(''))
    .labeled('<identifier>', {relabel: true})
    .ignoringSuccessFailures();
  const reader = part
    .separatedBy(Read.char(','))
    .between(Read.char('('), Read.char(')'))
    .lookahead(Read.eof());

  it('has the correct label', function() {
    expect(reader.label).to.be.equal("'(' [<identifier> separated by ','] ')' <EOF>");
  })

  it('reads empty', function() {
    expect(reader.read('()', 0))
      .to.be.deep.equal(ReadResult.token([], {
        position: 1,
        length: 0,
        next: 2,
        errors: [ReadResult.error('<identifier>', 1)]
      }));
  });

  it('reads one', function() {
    expect(reader.read('(xyz)', 0))
      .to.be.deep.equal(ReadResult.token([
        ReadResult.token('xyz', {
          position: 1,
          length: 3,
          next: 4
        })
      ], {
        position: 1,
        length: 3,
        next: 5,
        errors: [ReadResult.error("','", 4)]
      }));
  });
  it('reads many', function() {
    expect(reader.read('(a,b,c)', 0))
      .to.deep.equal(ReadResult.token([
        ReadResult.token('a', {
          position: 1,
          length: 1,
          next: 2
        }),
        ReadResult.token('b', {
          position: 3,
          length: 1,
          next: 4
        }),
        ReadResult.token('c', {
          position: 5,
          length: 1,
          next: 6
        })
      ], {
        position: 1,
        length: 5,
        next: 7,
        errors: [ReadResult.error("','", 6)]
      }));
  });

  it('fails when starting with separator', function() {
    expect(reader.read('(,abc)', 0))
      .to.be.deep.equal(ReadResult.failure(
        ReadResult.error('<identifier>', 1),
        ReadResult.error("')'", 1)));
  })

  it('fails when ending with separator', function() {
    expect(reader.read('(abc,)', 0))
      .to.be.deep.equal(ReadResult.failure(
        ReadResult.error('<identifier>', 5),
        ReadResult.error("')'", 4)));
  })
});