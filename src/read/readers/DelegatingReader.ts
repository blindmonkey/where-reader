import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class DelegatingReader<T> extends AbstractReader<T> {
  delegate!: Reader<T>;
  read(str: string, index: number): ReadToken<T> | null {
    return this.delegate.read(str, index);
  }
}