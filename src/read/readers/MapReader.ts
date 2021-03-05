import { AbstractReader } from "./AbstractReader";
import { Reader } from "./Reader";
import { ReadToken } from "./ReadToken";

export class TransformReader<Input, Output> extends AbstractReader<Output> {
  reader: Reader<Input>;
  transform: (input: Input) => Output;
  constructor(reader: Reader<Input>, transform: (input: Input) => Output) {
    super();
    this.reader = reader;
    this.transform = transform;
  }
  read(str: string, index: number): ReadToken<Output> | null {
    const value = this.reader.read(str, index);
    if (value == null) return null;
    return {
      value: this.transform(value.value),
      position: value.position,
      length: value.length,
      next: value.next
    };
  }
}