import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Read } from '../src/read/Read';

describe('MiddleReader', function() {
  it('labels chars', function() {
    expect(Read.char('b').between(Read.char('a'), Read.char('c')).label)
      .to.be.equal("'a' 'b' 'c'");
  });

  it('labels recursively', function() {
    expect(Read.char('b').repeated().between(Read.char('a'), Read.char('c')).label)
      .to.be.equal("'a' [...'b'] 'c'");
  });
});

describe('LookaheadReader', function() {
  it('labels char', function() {
    expect(Read.char('a').lookahead(Read.eof()).label)
      .to.be.equal("'a' <EOF>");
  });

  it('labels recursively', function() {
    expect(Read.char('a').repeated().lookahead(Read.eof()).label)
      .to.be.equal("[...'a'] <EOF>");
  });
});