import { Reader } from "./Reader";

export interface ReadToken<T> {
  type: 'token';
  value: T;
  position: number;
  length: number;
  next: number;
  failures?: ReadError[];
}

export interface ReadError {
  position: number;
  expected: string;
  context: {position: number, label: string}[];
}
export interface ReadFailure {
  type: 'failure';
  errors: ReadError[];
  // reader: string,
  // reader: Reader<T>;
  // expected: string;
  // position: number;
  // subfailures: ReadFailure[];
  // context: string[];
}

export type ReadResult<T> = ReadToken<T> | ReadFailure;