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
  private delegate: [Reader<T>] | [DelegateFn<T>, LabelArgument];
  constructor();
  constructor(delegate: Reader<T>);
  constructor(delegate: DelegateFn<T>, label: LabelArgument);
  constructor(...args: [] | [Reader<T>] | [DelegateFn<T>, LabelArgument]) {
    super();
    if (args.length === 0) {
      this.delegate = [() => { throw 'No delegating reader specified'; }, 'no delegate'];
    } else {
      this.delegate = args;
    }
  }
  get label(): string {
    switch (this.delegate.length) {
      case 1: return this.delegate[0].label;
      case 2:
        const label = this.delegate[1];
        switch (typeof label) {
          case 'string': return label;
          case 'function': return label();
        }
    }
  }
  setDelegate(delegate: Reader<T>): void;
  setDelegate(delegate: DelegateFn<T>, label: string): void;
  setDelegate(...args: [Reader<T>] | [DelegateFn<T>, LabelArgument]) {
    this.delegate = args;
  }
  read(str: string, index: number): ReadResult<T> {
    switch (this.delegate.length) {
      case 1: return this.delegate[0].read(str, index);
      case 2: return this.delegate[0](str, index);
    }
  }
}