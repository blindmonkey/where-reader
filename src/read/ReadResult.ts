import { Reader } from "./Reader";

export interface ReadToken<T> {
  type: 'token';
  value: T;
  position: number;
  length: number;
  next: number;
  errors: ReadError[];
}

export interface ReadError {
  position: number;
  expected: string;
  context: {position: number, label: string}[];
}
export interface ReadFailure {
  type: 'failure';
  errors: ReadError[];
}

export type ReadResult<T> = ReadToken<T> | ReadFailure;