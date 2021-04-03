import { describe, it } from 'mocha';
import { expect } from 'chai';

import { value, Json } from '../../src/languages/json/complex';
import { Read } from '../../src/read/Read';
import { error, errors, read } from '../read-helpers';
import { ReadResult } from '../../src/read/ReadResult';

const reader = value.lookahead(Read.eof());
function itShouldFail(name: string, str: string, ...errors: {expected: string, position: number, context: string}[]) {
  it(`should fail for ${name}`, function() {
    expect(read(reader, str))
      .to.be.deep.equal({ errors });
  });
}

//*
describe('JSON', function() {
  it('should parse number', function() {
    expect(read(value, '')).to.be.deep.equal(errors(
      error('JSON value', 0)
    ));
    expect(read(value, '42')).to.be.deep.equal(ReadResult.token(
      Json.number('42'), {
        position: 0,
        length: 2,
        next: 2,
        errors: [
          ReadResult.error("'-'", 0, [
            ReadResult.context('JSON value', 0),
            ReadResult.context('number literal', 0),
            ReadResult.context('integer', 0)
          ]),
          ReadResult.error("'0'", 2, [
            ReadResult.context('JSON value', 0),
            ReadResult.context('number literal', 0),
            ReadResult.context('integer', 0),
            ReadResult.context('digits', 1)
          ]),
          ReadResult.error('/[1-9]/', 2, [
            ReadResult.context('JSON value', 0),
            ReadResult.context('number literal', 0),
            ReadResult.context('integer', 0),
            ReadResult.context('digits', 1)
          ]),
          ReadResult.error('fractional component', 2, [
            ReadResult.context('JSON value', 0),
            ReadResult.context('number literal', 0)
          ]),
          ReadResult.error('exponent', 2, [
            ReadResult.context('JSON value', 0),
            ReadResult.context('number literal', 0)
          ])
        ]
      }));
  });

  it('should support recursion', function() {
    function rec(n: number): 0 {
      if (n > 0) {
        return rec(n - 1);
      }
      return 0;
    }
    const erec = eval(`
(function() {
  function rec(n) {
    if (n > 0) {
      return rec(n - 1);
    }
    return 0;
  }
  return rec;
})`)();
    const reps = 300;
    expect(rec(reps)).to.be.equal(0);
    expect(erec(reps)).to.be.equal(0);
  });
  const reps = 92;
  it(`should parse ${reps} nested arrays`, function() {
    const res = read(value, '['.repeat(reps) + ']'.repeat(reps))
    let arr = Json.array([]);
    for (let i = 1; i < reps; i++) {
      arr = Json.array([arr]);
    }
    expect(res.value).to.be.deep.equal(arr);
  });

  itShouldFail('array_1_true_without_comma', '[1 true]', {
    expected: 'string literal | JSON object | boolean literal | "null" | number literal',
    position: 0,
    context: 'JSON value:0'
  }, {
    expected: 'integer',
    position: 1,
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    expected: "fractional component | exponent",
    position: 2,
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    expected: "',' | ']'",
    position: 3,
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_colon_instead_of_comma', '["": 1]', {
    position: 0,
    expected: 'string literal | JSON object | boolean literal | "null" | number literal',
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_comma_and_number', '[,1]', {
    position: 0,
    expected: 'string literal | JSON object | boolean literal | "null" | number literal',
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_double_comma', '[1,,2]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_double_extra_comma', '["x",,]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 4,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 5,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_extra_comma', '["",]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_incomplete', '["x"', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_incomplete_invalid_value', '[x', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_inner_array_no_comma', '[3[4]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_items_separated_by_colon', '[1:2]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_just_comma', '[,]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('string_escaped_ctrl_char_tab', '"\\\t"', {
    position: 0,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > string literal:0'
  }, {
    position: 2,
    expected: "valid escape character",
    context: 'JSON value:0 > string literal:0'
  });

  itShouldFail('array_just_minus', '[-]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('array_missing_value', '[   , ""]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_number_and_comma', '[1,]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_number_and_several_commas', '[1,,]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_star_inside', '[*]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_unclosed', '[""', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_unclosed_trailing_comma', '[1,', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('array_unclosed_with_object_inside', '[{}', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "string literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > JSON object:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('incomplete_false', '[fals]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('incomplete_null', '[nul]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('incomplete_true', '[tru]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_++', '[++1234]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_+1', '[+1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_+Inf', '[+Inf]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_-01', '[-01]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_-1.0.', '[-1.0.]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 5,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:3 > digits:4'
  }, {
    position: 5,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 5,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_-2.', '[-2.]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:3'
  });

  itShouldFail('number_-NaN', '[-NaN]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('number_.-1', '[.-1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_.2e-3', '[.2e-3]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_0.1.2', '[0.1.2]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_0.3e+', '[0.3e+]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:4'
  });

  itShouldFail('number_0.3e', '[0.3e]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 5,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:4'
  });

  itShouldFail('number_0.e1', '[0.e1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_0_capital_E+', '[0E+]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_0_capital_E', '[0E]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_0e+', '[0e+]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_0e', '[0e]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_1.0e+', '[1.0e+]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:4'
  });

  itShouldFail('number_1.0e-', '[1.0e-]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:4'
  });

  itShouldFail('number_1.0e', '[1.0e]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 5,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:4'
  });

  itShouldFail('number_1_000', '[1 000.0]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_1eE2', '[1eE2]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_2.e+3', '[2.e+3]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_2.e-3', '[2.e-3]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_2.e3', '[2.e3]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_9.e+', '[9.e+]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_Inf', '[Inf]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_NaN', '[NaN]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_expression', '[1+2]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_hex_1_digit', '[0x1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_hex_2_digits', '[0x42]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_infinity', '[Infinity]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_invalid+-', '[0e+-1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 4,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_invalid-negative-real', '[-123.123foo]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 5,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1 > digits:3'
  }, {
    position: 9,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:5 > digits:6'
  }, {
    position: 9,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 9,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_minus_infinity', '[-Infinity]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('number_minus_sign_with_trailing_garbage', '[-foo]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('number_minus_space_1', '[- 1]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('number_neg_int_starting_with_zero', '[-012]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_neg_real_without_int_part', '[-.123]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | JSON object | boolean literal | \"null\"",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "/[1-9]/ | '0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > integer:1'
  });

  itShouldFail('number_neg_with_garbage_at_end', '[-1x]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 3,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_real_garbage_after_e', '[1ea]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "'+' | '-' | digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > exponent:2'
  });

  itShouldFail('number_real_without_fractional_part', '[1.]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "digits",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2'
  });

  itShouldFail('number_starting_with_dot', '[.123]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_with_alpha', '[1.2a-3]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 4,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_with_alpha_char', '[1.8011670033376514H-308]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 19,
    expected: "'0' | /[1-9]/",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1 > fractional component:2 > digits:3'
  }, {
    position: 19,
    expected: "exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 19,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('number_with_leading_zero', '[012]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('object_bad_value', '["x", truth]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 4,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('object_bracket_key', '{[: "x"}\n', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_comma_instead_of_colon', '{"x", null}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 4,
    expected: "':'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_double_colon', '{"x"::"b"}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 5,
    expected: "JSON value",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_garbage_at_end', '{"a":"a" 123}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 7,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > JSON value:5 > string literal:5'
  }, {
    position: 9,
    expected: "',' | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_key_with_single_quotes', "{key: 'value'}", {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_missing_colon', '{"a" b}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 5,
    expected: "':'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_missing_key', '{:"b"}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_missing_semicolon', '{"a" "b"}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 5,
    expected: "':'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_missing_value', '{"a":', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 5,
    expected: "JSON value",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_no-colon', '{"a"', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 4,
    expected: "':'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_non_string_key', '{1:1}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_non_string_key_but_huge_number_instead', '{9999E9999:1}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_repeated_null_null', '{null:null,null:null}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_several_trailing_commas', '{"id":0,,,,,}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 4,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 6,
    expected: "integer",
    context: 'JSON value:0 > JSON object:0 > JSON value:6 > number literal:6'
  }, {
    position: 7,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON object:0 > JSON value:6 > number literal:6'
  }, {
    position: 7,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 8,
    expected: "string literal",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_single_quote', "{'a':0}", {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_trailing_comma', '{"id":0,}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 4,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 6,
    expected: "integer",
    context: 'JSON value:0 > JSON object:0 > JSON value:6 > number literal:6'
  }, {
    position: 7,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON object:0 > JSON value:6 > number literal:6'
  }, {
    position: 7,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 8,
    expected: "string literal",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_two_commas_in_a_row', '{"a":"b",,"c":"d"}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 7,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > JSON value:5 > string literal:5'
  }, {
    position: 8,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 9,
    expected: "string literal",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_unquoted_key', '{a: "b"}', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('object_unterminated-value', '{"a":"a', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 5,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON object:0 > JSON value:5'
  }, {
    position: 7,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON object:0 > JSON value:5 > string literal:5'
  });

  itShouldFail('object_with_single_string', '{ "foo" : "bar", "a" }', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 6,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:2'
  }, {
    position: 14,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > JSON value:10 > string literal:10'
  }, {
    position: 15,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 19,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:17'
  }, {
    position: 21,
    expected: "':'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('string_1_surrogate_then_escape', '["\\uD800\\"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 11,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_1_surrogate_then_escape_u', '["\\uD800\\u"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 8,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 9,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_1_surrogate_then_escape_u1', '["\\uD800\\u1"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 8,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 9,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_1_surrogate_then_escape_u1x', '["\\uD800\\u1x"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 8,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 9,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_escape_x', '["\\x00"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_escaped_backslash_bad', '["\\\\\\"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 7,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_escaped_ctrl_char_tab', '["\	"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_incomplete_escape', '["\\"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 5,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_incomplete_escaped_character', '["\\u00A"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_incomplete_surrogate', '["\\uD834\\uDd"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 8,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 9,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_incomplete_surrogate_escape_invalid', '["\\uD800\\uD800\\x"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 14,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 15,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_invalid_backslash_esc', '["\\a"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_invalid_unicode_escape', '["\\uqqqq"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_single_quote', "['single quote']", {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('string_start_escape_unclosed', '["\\', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_unescaped_newline', '["new\nline"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 5,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_unescaped_tab', '["\t"]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('string_unicode_CapitalU', '"\\UA66D"', {
    position: 0,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > string literal:0'
  }, {
    position: 2,
    expected: "valid escape character",
    context: 'JSON value:0 > string literal:0'
  });

  itShouldFail('structure_array_with_unclosed_string', '["asd]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('structure_capitalized_True', '[True]', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_close_unopened_array', '1]', {
    position: 0,
    expected: "integer",
    context: 'JSON value:0 > number literal:0'
  }, {
    position: 1,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > number literal:0'
  }, {
    position: 1,
    expected: "<EOF>",
    context: ''
  });

  itShouldFail('structure_comma_instead_of_closing_brace', '{"x": true,', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 6,
    expected: "JSON value",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 10,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 11,
    expected: "string literal",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_end_array', ']', {
    position: 0,
    expected: "JSON value",
    context: ''
  });

  itShouldFail('structure_lone-open-bracket', '[', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_object_unclosed_no_value', '{"":', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 2,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 4,
    expected: "JSON value",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_array_apostrophe', '[\'', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_open_array_comma', '[,', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON value | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_open_array_open_object', '[{', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > JSON object:1'
  });

  itShouldFail('structure_open_array_open_string', '["a', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('structure_open_array_string', '["a"', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 4,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_open_object', '{', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_object_close_array', '{]', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_object_comma', '{,', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_object_open_array', '{[', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_object_open_string', '{"a', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "'}'",
    context: 'JSON value:0 > JSON object:0'
  }, {
    position: 3,
    expected: "'\\' | valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  });

  itShouldFail('structure_open_object_string_with_apostrophes', "{'a'", {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "string literal | '}'",
    context: 'JSON value:0 > JSON object:0'
  });

  itShouldFail('structure_open_open', '["\\{["\\{["\\{["\\{', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "JSON array | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0 > JSON array:0 > JSON value:1'
  }, {
    position: 1,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 2,
    expected: "valid unescaped char | '\"'",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  }, {
    position: 3,
    expected: "valid escape character",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > string literal:1'
  });

  itShouldFail('structure_unclosed_array', '[1', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 1,
    expected: "integer",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "fractional component | exponent",
    context: 'JSON value:0 > JSON array:0 > JSON value:1 > number literal:1'
  }, {
    position: 2,
    expected: "',' | ']'",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_unclosed_array_partial_null', '[ false, nul', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 7,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 9,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_unclosed_array_unfinished_false', '[ true, fals', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 6,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 8,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_unclosed_array_unfinished_true', '[ false, tru', {
    position: 0,
    expected: "string literal | JSON object | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 2,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 7,
    expected: "']'",
    context: 'JSON value:0 > JSON array:0'
  }, {
    position: 9,
    expected: "JSON value",
    context: 'JSON value:0 > JSON array:0'
  });

  itShouldFail('structure_unclosed_object', '{"asd":"asd"', {
    position: 0,
    expected: "string literal | JSON array | boolean literal | \"null\" | number literal",
    context: 'JSON value:0'
  }, {
    position: 5,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > string literal:1'
  }, {
    position: 11,
    expected: "'\\' | valid unescaped char",
    context: 'JSON value:0 > JSON object:0 > JSON value:7 > string literal:7'
  }, {
    position: 12,
    expected: "',' | '}'",
    context: 'JSON value:0 > JSON object:0'
  });
});