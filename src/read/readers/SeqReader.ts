import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadResult, ReadToken } from "../ReadResult";
import { MapReader, MapReadToken, MapReadType } from "../Types";


/**
 * Reads a number of explicitly specified `Reader`s arranged sequentially.
 * However, because of a lack of support for variadic generics in TypeScript,
 * `T` must be the same for all the readers.
 */
export class SeqReader<T extends unknown[]> extends AbstractReader<MapReadToken<T>> {
  readers: MapReader<T>;
  get label(): string {
    return this.readers.map(r => r.label).join(' ');
  }
  private constructor(...readers: MapReader<T>) {
    super();
    this.readers = readers;
  }
  static make<Readers extends Reader<unknown>[]>(...readers: Readers): SeqReader<MapReadType<Readers>> {
    // This static method is unfortunately necessary, because the only way to be
    // able to specify concrete `Reader` types, since otherwise the type is
    // limited to exactly an array of `Reader<unknown>`.
    return new SeqReader<MapReadType<Readers>>(...readers as any);
  }
  read(str: string, index: number): ReadResult<MapReadToken<T>> {
    const tokens: ReadToken<unknown>[] = [];
    let i = index;
    for (let r = 0; r < this.readers.length; r++) {
      const reader = this.readers[r];
      const result = reader.read(str, i);
      if (ReadResult.isFailure(result)) {
        return ReadResult.failure(
          ...tokens.flatMap(t => t.errors),
          ...result.errors);
      }
      tokens.push(result);
      i = result.next;
    }
    const lastToken = tokens.length === 0 ? null : tokens[tokens.length - 1];
    return ReadResult.token<any>(tokens, {
      position: index,
      length: lastToken == null ? 0 : lastToken.position + lastToken.length - index,
      next: lastToken == null ? index : lastToken.next,
      errors: tokens.flatMap(t => t.errors)
    });
  }
}