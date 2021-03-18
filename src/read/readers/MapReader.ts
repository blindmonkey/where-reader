import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

/**
 * The `MapReader` applies a mapping function to the result of a delegate
 * `Reader`. This can be useful for mapping raw reads to tokens, flattening
 * repeating structures, on top of other things. In this reader, the `transform`
 * function does not have access to the raw token information.
 */
export class MapReader<Input, Output> extends AbstractReader<Output> {
  reader: Reader<Input>;
  transform: (input: Input) => Output;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<Input>, transform: (input: Input) => Output) {
    super();
    this.reader = reader;
    this.transform = transform;
  }
  read(str: string, index: number): ReadResult<Output> {
    const result = this.reader.read(str, index);
    if (result.type === 'failure') return result;
    return {
      type: 'token',
      value: this.transform(result.value),
      position: result.position,
      length: result.length,
      next: result.next,
      errors: result.errors
    };
  }
}