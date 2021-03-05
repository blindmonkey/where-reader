
export interface ReadToken<T> {
  value: T;
  position: number;
  length: number;
  next: number;
}