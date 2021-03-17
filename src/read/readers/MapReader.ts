import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

export class TransformReader<Input, Output> extends AbstractReader<Output> {
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
      failures: result.failures
    };
  }
}