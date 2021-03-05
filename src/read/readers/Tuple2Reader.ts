import { AbstractReader } from "./AbstractReader";
import { Reader } from "./Reader";
import { ReadToken } from "./ReadToken";

export class Tuple2Reader<A, B> extends AbstractReader<[ReadToken<A>, ReadToken<B>]> {
  a: Reader<A>;
  b: Reader<B>;
  constructor(a: Reader<A>, b: Reader<B>) {
    super();
    this.a = a;
    this.b = b;
  }
  read(str: string, index: number): ReadToken<[ReadToken<A>, ReadToken<B>]> | null {
    const a = this.a.read(str, index);
    if (a == null) return null;
    const b = this.b.read(str, a.next);
    if (b == null) return null;
    return {
      value: [a, b],
      position: index,
      length: b.position + b.length - a.position,
      next: b.next
    };
  }
}