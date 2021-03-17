import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadError, ReadResult } from "../ReadResult";

export interface LabelOptions {
  relabel?: boolean;
  context?: boolean;
}
export class LabeledReader<T> extends AbstractReader<T> {
  label: string;
  delegate: Reader<T>;
  options: LabelOptions;
  constructor(delegate: Reader<T>, label: string, options: LabelOptions = {}) {
    super();
    this.delegate = delegate;
    this.label = label;
    this.options = options;
  }
  private get relabel(): boolean {
    return this.options.relabel ?? false;
  }
  private get addContext(): boolean {
    return this.options.context ?? true;
  }
  private modifyErrors(errors: ReadError[], index: number): ReadError[] {
    if (this.relabel) {
      return [{
        position: index,
        expected: this.label,
        context: []
      }];
    } else if (this.addContext) {
      return errors.map(error => ({
        position: error.position,
        expected: error.expected,
        context: [{position: index, label: this.label}].concat(error.context)
      }));
    } else {
      return errors;
    }
  }
  read(str: string, index: number): ReadResult<T> {
    // console.info('Reading:', this.label, str.slice(index));
    const result = this.delegate.read(str, index);
    if (result.type === 'failure') {
      return {
        type: 'failure',
        errors: this.modifyErrors(result.errors, index)
      };
    }
    return {
      type: 'token',
      value: result.value,
      position: result.position,
      length: result.length,
      next: result.next,
      failures: this.modifyErrors(result.failures ?? [], index)
    };
  }
}