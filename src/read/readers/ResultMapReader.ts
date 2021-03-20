import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

/**
 * Transform the `ReadToken<T>` into a `ReadResult<Output>`.
 */
export class ResultMapReader<T, Output> extends AbstractReader<Output> {
  reader: Reader<T>;
  transform: (token: ReadResult<T>, position: number) => ReadResult<Output>;
  get label(): string {
    return this.reader.label;
  }
  constructor(reader: Reader<T>, transform: (token: ReadResult<T>, position: number) => ReadResult<Output>) {
    super();
    this.reader = reader;
    this.transform = transform;
  }
  read(str: string, index: number): ReadResult<Output> {
    const result = this.reader.read(str, index);
    return this.transform(result, index);
  }
}