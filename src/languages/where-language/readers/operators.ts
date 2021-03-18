import { Read } from "../../../read/Read";
import { Reader } from "../../../read/Reader";
import { Operator } from "../tokens";

const and = Read.literal('and', false);
const or = Read.literal('or', false);
const terminator = Read.regexChar(/[^a-zA-Z_0-9]/);
export const operator: Reader<Operator> =
  Read.literal('=')
  .or(Read.literal('<='))
  .or(Read.literal('>='))
  .or(Read.literal('<'))
  .or(Read.literal('>'))
  .or(Read.literal('in', false).lookahead(terminator))
  .or(and.lookahead(terminator))
  .or(or.lookahead(terminator))
  .or(Read.literal('+'))
  .or(Read.literal('-'))
  .or(Read.literal('*'))
  .or(Read.literal('/'))
  .or(Read.literal('^'))
  .labeled('operator', {relabel: true})
  .ignoringSuccessFailures();