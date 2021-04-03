const tokenSymbol: unique symbol = Symbol('token');
const failureSymbol: unique symbol = Symbol('failure');

type TokenSymbol = typeof tokenSymbol;
type FailureSymbol = typeof failureSymbol;
type Symbols = {
  token: TokenSymbol,
  failure: FailureSymbol
};
const Symbols: Symbols = {
  token: tokenSymbol,
  failure: failureSymbol
};

export interface ReadToken<T> {
  type: Symbols['token'];
  value: T;
  position: number;
  length: number;
  next: number;
  errors: ReadError[];
}

export interface ReadContext {
  position: number;
  label: string;
}
export interface ReadError {
  position: number;
  expected: string;
  context: ReadContext[];
}
export interface ReadFailure {
  type: Symbols['failure'];
  errors: ReadError[];
}

export type ReadResult<T> = ReadToken<T> | ReadFailure;

export namespace ReadResult {
  export function token<T>(value: T, position: { position: number, length: number, next: number, errors?: ReadError[] }): ReadToken<T> {
    return {
      type: Symbols.token,
      value: value,
      position: position.position,
      length: position.length,
      next: position.next,
      errors: position.errors ?? []
    };
  }
  export function failure(...errors: ReadError[]): ReadFailure {
    return {
      type: Symbols.failure,
      errors: errors
    };
  }
  export function context(label: string, position: number): ReadContext {
    return { label, position };
  }
  export function error(expected: string, position: number, context: ReadContext[] = []): ReadError {
    return {
      expected: expected,
      position: position,
      context: context
    }
  }
  export function isSuccess<T>(result: ReadResult<T>): result is ReadToken<T> {
    return result.type === Symbols.token;
  }
  export function isFailure<T>(result: ReadResult<T>): result is ReadFailure {
    return result.type === Symbols.failure;
  }
  export function flatMap<T, Output>(result: ReadResult<T>, token: (token: ReadToken<T>) => ReadResult<Output>, failure: (failure: ReadFailure) => ReadResult<Output>): ReadResult<Output> {
    switch (result.type) {
      case Symbols.token: return token(result);
      case Symbols.failure: return failure(result);
    }
  }
}