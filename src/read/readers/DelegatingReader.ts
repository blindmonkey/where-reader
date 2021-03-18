import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";

/**
 * The `DelegatingReader` is specifically around for supporting recursive
 * grammars. It should be used with care, but circular grammars are a common
 * feature of modern languages, especially at the expression level.
 */
export class DelegatingReader<T> extends AbstractReader<T> {
  delegate!: Reader<T>;
  get label(): string {
    return this.delegate.label;
  }
  read(str: string, index: number): ReadResult<T> {
    return this.delegate.read(str, index);
  }
}