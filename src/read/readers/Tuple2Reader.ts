import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";

export class Tuple2Reader<A, B> extends AbstractReader<[ReadToken<A>, ReadToken<B>]> {
  a: Reader<A>;
  b: Reader<B>;
  get label(): string {
    return `${this.a.label} ${this.b.label}`;
  }
  constructor(a: Reader<A>, b: Reader<B>) {
    super();
    this.a = a;
    this.b = b;
  }
  read(str: string, index: number): ReadResult<[ReadToken<A>, ReadToken<B>]> {
    const a = this.a.read(str, index);
    if (a.type === 'failure') return a;
    const b = this.b.read(str, a.next);
    if (b.type === 'failure') {
      return {
        type: 'failure',
        errors: (a.failures ?? []).concat(b.errors)
      };
    }
    return {
      type: 'token',
      value: [a, b],
      position: index,
      length: b.position + b.length - a.position,
      next: b.next,
      failures: (a.failures ?? []).concat(b.failures ?? [])
    };
  }
}