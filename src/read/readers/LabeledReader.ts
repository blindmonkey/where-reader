import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadToken } from "../ReadToken";

export class LabeledReader<T> extends AbstractReader<T> {
  label: string;
  delegate: Reader<T>;
  constructor(delegate: Reader<T>, label: string) {
    super();
    this.delegate = delegate;
    this.label = label;
  }
  read(str: string, index: number): ReadToken<T> | null {
    // console.info('Reading:', this.label, str.slice(index));
    return this.delegate.read(str, index);
  }
}