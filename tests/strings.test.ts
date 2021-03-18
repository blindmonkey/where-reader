import { describe, it } from 'mocha';
import { expect } from 'chai';

import { string } from '../src/languages/where-language/readers/primitives'
import { read, string as stringt } from './read-helpers';
import { Read } from '../src/read/Read';

function s(content: string): string {
  return `"${content}"`;
}

describe('string', function() {
  it('should start with a double quote', function() {
    expect(read(string, 'hello"'))
      .to.deep.equal({
        errors: [{
          position: 0,
          expected: "string literal",
          context: ''
        }]
      });
    expect(read(string, ''))
      .to.deep.equal({
        errors: [{
          position: 0,
          expected: "string literal",
          context: ''
        }]
      });
  });

  it('empty string', function() {
    expect(read(string, s('')))
      .to.deep.equal(stringt('', 0, 2));
  });

  it('normal string content', function() {
    expect(read(string, s('x')))
      .to.deep.equal(stringt('x', 0, 3));

    expect(read(string, s('hello')))
      .to.deep.equal(stringt('hello', 0, 7));
  });

  it('incorrect quote string', function() {
    expect(read(string, s('a"b')))
      .to.deep.equal(stringt('a', 0, 3));
  });
  it('escapes quote', function() {
    expect(read(string, s('a\\"b')))
      .to.deep.equal(stringt('a"b', 0, 6));
  })
});