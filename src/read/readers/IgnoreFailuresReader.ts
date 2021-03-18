import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

/**
 * Contrary to its name, the `IgnoreFailureReader` does not ignore all read
 * failures. However, it does stop the propagation of failures within a
 * successful read. This can be useful for silencing errors in instances such as
 * attempting to read an integer via a repeated digit read, and encountering an
 * operator. While it's certainly true that there was a repeated failure, it's
 * not useful to propagate this because the error is either easily intuited or
 * another reader will fail later on.
 *
 * TODO: Explore alternate names.
 */
export class IgnoreFailuresReader<T> extends AbstractReader<T> {
  private reader: Reader<T>;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<T>) {
    super();
    this.reader = reader;
  }
  read(str: string, index: number): ReadResult<T> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') return result;
    return {
      type: 'token',
      position: result.position,
      length: result.length,
      value: result.value,
      next: result.next,
      errors: []
    };
  }

}