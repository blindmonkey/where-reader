import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

export class DelegatingReader<T> extends AbstractReader<T> {
  delegate!: Reader<T>;
  get label(): string {
    return this.delegate.label;
  }
  read(str: string, index: number): ReadResult<T> {
    return this.delegate.read(str, index);
  }
}