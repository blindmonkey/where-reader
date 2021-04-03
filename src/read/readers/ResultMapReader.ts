import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";
import { Compilable, compilation, Symbols } from "./CompilationSupport";

export type LabelArgument = string | (() => string);

/**
 * Transform the `ReadToken<T>` into a `ReadResult<Output>`.
 */
export class ResultMapReader<T, Output> extends AbstractReader<Output> implements Compilable<'resultMap'> {
  private label_: LabelArgument | null;
  [compilation]: Symbols['resultMap'] = Symbols.resultMap;
  reader: Reader<T>;
  transform: (token: ReadResult<T>, str: string, position: number) => ReadResult<Output>;
  get label(): string {
    const label = this.label_;
    if (typeof(label) === 'string') {
      return label;
    } else if (label != null) {
      return label();
    } else {
      return this.reader.label;
    }
  }
  constructor(reader: Reader<T>, transform: (token: ReadResult<T>, str: string, position: number) => ReadResult<Output>, label: LabelArgument | null = null) {
    super();
    this.label_ = label ?? (() => reader.label);
    if (reader instanceof ResultMapReader) {
      this.reader = reader.reader;
      this.transform = (result, str, index) =>
        transform(reader.transform(result, str, index), str, index);
    } else {
      this.reader = reader;
      this.transform = transform;
    }
  }
  read(str: string, index: number): ReadResult<Output> {
    const result = this.reader.read(str, index);
    return this.transform(result, str, index);
  }
}