import { Reader } from "./Reader";
import { ReadError, ReadFailure, ReadResult, ReadToken } from "./ReadResult";

export abstract class AbstractReader<T> implements Reader<T> {
  abstract label: string;
  abstract read(str: string, index: number): ReadResult<T>;
  or<Other>(other: Reader<Other>): Reader<T | Other> {
    return this.mapResult<T | Other>((leftValue, str, index) => {
      switch (leftValue.type) {
        case 'token':
          return leftValue;
        case 'failure':
          const rightValue = other.read(str, index);
          // And argument could be made here for propagating the errors from
          // `leftValue`. However, It's currently unclear whether there are instances
          // where these errors would be useful.
          switch (rightValue.type) {
            case 'token': return rightValue;
            case 'failure':
              return <ReadFailure>{
                type: 'failure',
                errors: leftValue.errors.concat(rightValue.errors)
              };
          }
      }
    }, () => `${this.label} | ${other.label}`);
  }
  map<Output>(f: (input: T) => Output, label?: LabelArgument): Reader<Output> {
    return this.mapToken(token => f(token.value));
  }
  mapResult<Output>(f: (result: ReadResult<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output> {
    return new ResultMapReader(this, f, label);
  }
  flatMap<Output>(f: (token: ReadToken<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output> {
    return this.mapResult((result, str, position) => {
      switch (result.type) {
        case 'failure': return result;
        case 'token': return f(result, str, position);
      }
    }, label);
  }
  mapFailure(f: (failure: ReadFailure, str: string, position: number) => ReadResult<T>, label?: LabelArgument): Reader<T> {
    return this.mapResult((result, str, position) => {
      switch (result.type) {
        case 'failure': return f(result, str, position);
        case 'token': return result;
      }
    }, label);
  }
  mapToken<Output>(f: (token: ReadToken<T>, str: string, position: number) => Output, label?: LabelArgument): Reader<Output> {
    return this.flatMap((token, str, position) => ({
      type: 'token',
      value: f(token, str, position),
      position: token.position,
      length: token.length,
      next: token.next,
      errors: token.errors
    }), label);
  }
  then<Next extends Reader<unknown>[]>(...next: Next): Reader<MapReadToken<[T, ...MapReadType<Next>]>> {
    return SeqReader.make(this, ...next);
  }
  repeated(): Reader<ReadToken<T>[]> {
    return new DelegatingReader((str, index) => {
      const tokens: ReadToken<T>[] = [];
      let i = index;
      let failure: ReadFailure | null = null;
      while (true) {
        const value = this.read(str, i);
        if (value.type === 'failure') {
          failure = value;
          break;
        }
        tokens.push(value);
        i = value.next;
      }
      const lastToken = tokens[tokens.length - 1];
      return {
        type: 'token',
        value: tokens,
        position: index,
        length: lastToken == null ? 0 : lastToken.position + lastToken.length - index,
        next: lastToken == null ? index : lastToken.next,
        errors: failure.errors
      };
    }, () => `[...${this.label}]`);
  }
  separatedBy<Sep>(sep: Reader<Sep>): Reader<ReadToken<T>[]> {
    return this
      .then(sep.then(this).repeated())
      .map(tokens => [tokens[0]].concat(tokens[1].value.map((token) => token.value[1])))
      .mapFailure((failure, _, index) => ({
        type: 'token',
        value: [],
        position: index,
        length: 0,
        next: index,
        errors: failure.errors
      }), () => `[${this.label} separated by ${sep.label}]`);
  }
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): Reader<T> {
    return left.then(this, right)
      .map<ReadToken<T>>(tokens => tokens[1])
      .flatMap<T>(token => ({
        type: 'token',
        value: token.value.value,
        position: token.value.position,
        length: token.value.length,
        next: token.next,
        errors: token.errors
      }));
  }
  wrappedBy<Wrapper>(wrapper: Reader<Wrapper>): WrappedReader<T, Wrapper> {
    return new WrappedReader(this, wrapper);
  }
  labeled(label: string, options: LabelOptions = {}): Reader<T> {
    function modifyErrors(errors: ReadError[], index: number): ReadError[] {
      if (options.relabel ?? false) {
        return [{
          position: index,
          expected: label,
          context: []
        }];
      } else if (options.context ?? true) {
        return errors.map(error => ({
          position: error.position,
          expected: error.expected,
          context: [{position: index, label: label}].concat(error.context)
        }));
      } else {
        return errors;
      }
    }
    return this.mapResult((result, _, index) => {
      switch (result.type) {
        case 'failure':
          return <ReadFailure>{
            type: 'failure',
            errors: modifyErrors(result.errors, index)
          };
        case 'token':
          return {
            type: 'token',
            value: result.value,
            position: result.position,
            length: result.length,
            next: result.next,
            errors: modifyErrors(result.errors, index)
          };
      }
    }, label);
  }
  failWhen(condition: (value: T, str: string, index: number) => boolean): Reader<T> {
    const label = () => `${this.label} fails on condition`;
    return this.flatMap<T>((result, str, index) => {
      if (condition(result.value, str, index)) {
        return {
          type: 'failure',
          errors: [{
            expected: label(),
            position: index,
            context: []
          }]
        };
      }
      return result;
    }, label);
  }
  lookahead<Ahead>(ahead: Reader<Ahead>): Reader<T> {
    return this.then(ahead)
      .flatMap(result => {
        const token = result.value[0];
        return {
          type: 'token',
          position: token.position,
          next: token.next,
          length: token.length,
          value: token.value,
          errors: result.errors
        };
      });
  }
  optional(): Reader<T | null> {
    return this.mapResult<T | null>((result, _, index) => {
      switch (result.type) {
        case 'failure':
          return {
            type: 'token',
            value: null,
            position: index,
            next: index,
            length: 0,
            errors: result.errors
          };
        case 'token':
          return result;
      }
    }, () => `[${this.label}]`);
  }
  ignoringSuccessFailures(): Reader<T> {
    return this.flatMap(result => ({
      type: 'token',
      position: result.position,
      length: result.length,
      value: result.value,
      next: result.next,
      errors: []
    }));
  }
}

// These imports must come at the end, otherwise, AbstractReader is undefined
// when the subclasses try to inherit from it.
import { LabelOptions } from "./readers/LabelOptions";
import { WrappedReader } from "./readers/WrappedReader";
import { LabelArgument, ResultMapReader } from "./readers/ResultMapReader";
import { DelegatingReader } from "./readers/DelegatingReader";
import { SeqReader } from "./readers/SeqReader";
import { MapReader, MapReadToken, MapReadType } from "./Types";

