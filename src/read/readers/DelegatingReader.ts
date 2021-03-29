import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";
import { LabelArgument } from "./ResultMapReader";

export type DelegateFn<T> = (str: string, index: number) => ReadResult<T>;

/**
 * The `DelegatingReader` is specifically around for supporting recursive
 * grammars. It should be used with care, but circular grammars are a common
 * feature of modern languages, especially at the expression level.
 */
export class DelegatingReader<T> extends AbstractReader<T> {
  private delegate: {type: 'reader', reader: Reader<T>} | {type: 'function', delegate: DelegateFn<T>, label: LabelArgument};
  constructor();
  constructor(delegate: Reader<T>);
  constructor(delegate: DelegateFn<T>, label: LabelArgument);
  constructor(delegate?: Reader<T> | ((str: string, index: number) => ReadResult<T>), label?: LabelArgument) {
    super();
    if (delegate == null) {
      this.delegate = {
        type: 'function',
        delegate() {
          throw 'No delegating reader specified';
        },
        label: 'no delegate'
      };
    } else if (typeof delegate === 'function') {
      if (label == null) throw 'A label must be specified with a delegating function';
      this.delegate = {type: 'function', delegate, label};
    } else {
      this.delegate = {type: 'reader', reader: delegate};
    }
  }
  get label(): string {
    switch (this.delegate.type) {
      case 'function':
        const label = this.delegate.label;
        switch (typeof label) {
          case 'string': return label;
          case 'function': return label();
        }
      case 'reader': return this.delegate.reader.label;
    }
  }
  setDelegate(delegate: Reader<T>): void;
  setDelegate(delegate: DelegateFn<T>, label: string): void;
  setDelegate(delegate: Reader<T> | DelegateFn<T>, label?: string) {
    if (typeof delegate === 'function') {
      if (label == null) throw 'A label must be specified with a delegating function';
      this.delegate = {
        type: 'function',
        delegate: delegate,
        label: label
      };
    } else {
      this.delegate = {
        type: 'reader',
        reader: delegate
      };
    }
  }
  read(str: string, index: number): ReadResult<T> {
    switch (this.delegate.type) {
      case 'function': return this.delegate.delegate(str, index);
      case 'reader': return this.delegate.reader.read(str, index);
    }
  }
}