import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

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
      next: result.next
    };
  }

}