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
  constructor(...args: [] | [Reader<T>] | [DelegateFn<T>, LabelArgument]) {
    super();
    if (args.length === 0) {
      this.delegate = {
        type: 'function',
        delegate() {
          throw 'No delegating reader specified';
        },
        label: 'no delegate'
      };
    } else if (args.length === 2) {
      const [delegate, label] = args;
      this.delegate = {type: 'function', delegate, label};
    } else {
      this.delegate = {type: 'reader', reader: args[0]};
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
  setDelegate(...args: [Reader<T>] | [DelegateFn<T>, LabelArgument]) {
    if (args.length === 2) {
      const [delegate, label] = args;
      this.delegate = { type: 'function', delegate, label };
    } else {
      this.delegate = { type: 'reader', reader: args[0] };
    }
  }
  read(str: string, index: number): ReadResult<T> {
    switch (this.delegate.type) {
      case 'function': return this.delegate.delegate(str, index);
      case 'reader': return this.delegate.reader.read(str, index);
    }
  }
}