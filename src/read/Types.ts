import { AbstractReader } from "./AbstractReader";
import { Reader } from "./Reader";
import { ReadToken } from "./ReadResult";


type MapReaderSingle<Arr extends unknown[], K extends keyof Arr> =
  K extends number ?
    Reader<Arr[K]> :
    K extends `${number}` ?
      Reader<Arr[K]> :
      Arr[K];
/**
 * Consumes an array of types and returns an array of those types wrapped in
 * `Reader`s.
 *
 * e.g.:
 * MapReader<[]> => []
 * MapReader<[1, 2, 3]> => [Reader<1>, Reader<2>, Reader<3>]
 * MapReader<number[]> => Reader<number>[]
 */
export type MapReader<Arr extends unknown[]> =
  { [K in keyof Arr]: MapReaderSingle<Arr, K> }

type MapReadTokenSingle<Arr extends unknown[], K extends keyof Arr> =
  K extends number ?
    ReadToken<Arr[K]> :
    K extends `${number}` ?
      ReadToken<Arr[K]> :
      Arr[K];
/**
 * Consumes an array of types and returns an array of those types wrapped in
 * `ReadToken`s.
 *
 * e.g.:
 * MapReadToken<[]> => []
 * MapReadToken<[1, 2, 3]> => [ReadToken<1>, ReadToken<2>, ReadToken<3>]
 * MapReadToken<number[]> => ReadToken<number>[]
 */
export type MapReadToken<Arr extends unknown[]> =
  { [K in keyof Arr]: MapReadTokenSingle<Arr, K> }

type ReadType<R> =
  R extends Reader<infer T> ? T : never;
type MapReadTypeSingle<Arr extends unknown[], K extends keyof Arr> =
  K extends number ?
    ReadType<Arr[K]> :
    K extends `${number}` ?
      ReadType<Arr[K]> :
      Arr[K];
/**
 * Consumes an array of `Reader<...>` types and returns an array of the types
 * that the `Reader`s would return.
 *
 * e.g.:
 * MapReadType<[]> => []
 * MapReadType<[Reader<1>, Reader<2>, Reader<3>]> => [1, 2, 3]
 * MapReadType<Reader<number>[]> => number[]
 */
export type MapReadType<Arr extends Reader<unknown>[]> =
  { [K in keyof Arr]: MapReadTypeSingle<Arr, K>};

type NotNever<T> = [T] extends [never] ? 'never' : T;
function mapReader<Arr extends unknown[]>(): NotNever<MapReader<Arr>> {
  return null as any;
}
function mapReadToken<Arr extends unknown[]>(): NotNever<MapReadToken<Arr>> {
  return null as any;
}
function mapReadType<Arr extends Reader<unknown>[]>(): NotNever<MapReadType<Arr>> {
  return null as any;
}

{ const t: [] = mapReadType<[]>() }
{ const t: 1[]
  = mapReadType<AbstractReader<1>[]>() }
{ const t: [1, 2, 3] = mapReadType<[Reader<1>, Reader<2>, Reader<3>]>() }
{ const t: [1 , 2, ...3[]]
  = mapReadType<[AbstractReader<1>, AbstractReader<2>, ...AbstractReader<3>[]]>() }
// The types here, and in the corresponding type tests for `mapReader` and
// `mapReadToken` are not ideal, but they fulfill the purpose, since they're
// used in a varargs context, where a splat is only allowed at the end anyway.
// It would be nice to make the types work out to correctly be `[...1[], 2, 3]`
// and `[1, ...2[], 3]` respectively, but this level of type transformation
// unfortunately doesn't appear to be supported quite yet.
{ const t: [...(1 | 2 | 3)[], (1 | 2 | 3), (1 | 2 | 3)]
  = mapReadType<[...AbstractReader<1>[], AbstractReader<2>, AbstractReader<3>]>() }
{ const t: [1, ...(2 |3 )[], (2 | 3)]
  = mapReadType<[AbstractReader<1>, ...AbstractReader<2>[], AbstractReader<3>]>() }

{ const t: [] = mapReader<[]>() }
{ const t: Reader<1>[] = mapReader<1[]>() }
{ const t: [Reader<1> , Reader<2>, Reader<3>] = mapReader<[1, 2, 3]>() }
{ const t: [Reader<1> , Reader<2>, ...Reader<3>[]] = mapReader<[1, 2, ...3[]]>() }
{ const t: [...Reader<1 | 2 | 3>[], Reader<1 | 2 | 3>, Reader<1 | 2 | 3>] = mapReader<[...1[], 2, 3]>() }
{ const t: [Reader<1>, ...Reader<2 | 3>[], Reader<2 | 3>] = mapReader<[1, ...2[], 3]>() }

{ const t: [] = mapReadToken<[]>() }
{ const t: ReadToken<1>[] = mapReadToken<1[]>() }
{ const t: [ReadToken<1>, ReadToken<2>, ReadToken<3>] = mapReadToken<[1, 2, 3]>() }
{ const t: [ReadToken<1>, ReadToken<2>, ...ReadToken<3>[]] = mapReadToken<[1, 2, ...3[]]>() }
{ const t: [...ReadToken<1 | 2 | 3>[], ReadToken<1 | 2 | 3>, ReadToken<1 | 2 | 3>] = mapReadToken<[...1[], 2, 3]>() }
{ const t: [ReadToken<1>, ...ReadToken<2 | 3>[], ReadToken<2 | 3>] = mapReadToken<[1, ...2[], 3]>() }

