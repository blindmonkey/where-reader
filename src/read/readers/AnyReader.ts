import { AbstractReader } from "../AbstractReader";
import { Reader } from "../Reader";
import { ReadError, ReadResult } from "../ReadResult";
import { MapEither, MapReader, MapReadToken, MapReadType } from "../Types";

export class AnyReader<T extends unknown[]> extends AbstractReader<MapEither<T>> {
  readers: MapReader<T>;
  get label(): string {
    return this.readers.map(r => r.label).join(' | ')
  }
  constructor(...readers: MapReader<T>) {
    super();
    this.readers = readers;
  }
  static make<Readers extends Reader<any>[]>(...readers: Readers): AnyReader<MapReadType<Readers>> {
    return new AnyReader(...readers as any);
  }
  or<Other>(other: Reader<Other>): Reader<MapEither<T> | Other> {
    if (other instanceof AnyReader) {
      return AnyReader.make(
        ...this.readers,
        ...(other.readers as Reader<unknown>[])) as any;
    }
    return AnyReader.make(...this.readers, other) as any;
  }
  read(str: string, index: number): ReadResult<MapEither<T>> {
    const errors: ReadError[] = [];
    for (let i = 0; i < this.readers.length; i++) {
      const result = this.readers[i].read(str, index);
      if (ReadResult.isSuccess(result)) return result as any;
      errors.push(...result.errors);
    }
    return ReadResult.failure(...errors);
  }
}