import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

/**
 * Validate that the current reader and the next reader succeeds, but leave the
 * cursor after the first reader. This can be useful either to throw away the
 * `Ahead` result, or simply to validate that a reader isn't followed by some
 * invalid characters.
 *
 * One instance where this is particularly useful is literal operators. Though
 * they can be implemented in a number of different ways, one explicitly
 * incorrect way would be to `Read.literal("and")`, since we don't want this
 * reader to succeed when there are more characters after the `and`, since that
 * would make it an invalid operator.
 */
export class LookaheadReader<T, Ahead> extends AbstractReader<T> {
  reader: Reader<ReadToken<T>>;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<T>, ahead: Reader<Ahead>) {
    super();
    this.reader = reader.then(ahead)
      .map(tokens => tokens[0]);
  }

  read(str: string, index: number): ReadResult<T> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') return result;
    const token = result.value;
    return {
      type: 'token',
      position: token.position,
      next: token.next,
      length: token.length,
      value: token.value,
      errors: result.errors
    };
  }
}