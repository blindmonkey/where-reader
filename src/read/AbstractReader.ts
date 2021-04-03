import { Reader } from "./Reader";
import { ReadError, ReadFailure, ReadResult, ReadToken } from "./ReadResult";

export abstract class AbstractReader<T> implements Reader<T> {
  abstract label: string;
  abstract read(str: string, index: number): ReadResult<T>;
  or<Other>(other: Reader<Other>): Reader<T | Other> {
    return AnyReader.make(this, other);
  }
  map<Output>(f: (input: T) => Output, label?: LabelArgument): Reader<Output> {
    return this.mapToken(token => f(token.value));
  }
  mapResult<Output>(f: (result: ReadResult<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output> {
    return new ResultMapReader(this, f, label);
  }
  flatMap<Output>(f: (token: ReadToken<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output> {
    return this.mapResult((result, str, position) =>
      ReadResult.flatMap(
        result,
        token => f(token, str, position),
        failure => failure),
      label);
  }
  mapFailure(f: (failure: ReadFailure, str: string, position: number) => ReadResult<T>, label?: LabelArgument): Reader<T> {
    return this.mapResult((result, str, position) =>
      ReadResult.flatMap(
        result,
        token => token,
        failure => f(failure, str, position)),
      label);
  }
  mapToken<Output>(f: (token: ReadToken<T>, str: string, position: number) => Output, label?: LabelArgument): Reader<Output> {
    return this.flatMap((token, str, position) =>
      ReadResult.token(f(token, str, position), {
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
    return new RepeatReader(this);
  }
  separatedBy<Sep>(sep: Reader<Sep>): Reader<ReadToken<T>[]> {
    return this
      .then(sep.then(this).repeated())
      .map(tokens => [tokens[0]].concat(tokens[1].value.map((token) => token.value[1])))
      .mapFailure((failure, _, index) => ReadResult.token([], {
        position: index,
        length: 0,
        next: index,
        errors: failure.errors
      }), () => `[${this.label} separated by ${sep.label}]`);
  }
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): Reader<T> {
    return left.then(this, right)
      .map(tokens => tokens[1])
      .flatMap(token => ReadResult.token(token.value.value, {
        position: token.value.position,
        length: token.value.length,
        next: token.next,
        errors: token.errors
      }));
  }
  wrappedBy<Wrapper>(wrapper: Reader<Wrapper>): Reader<T> {
    return this.between(wrapper, wrapper);
  }
  labeled(label: string, options: LabelOptions = {}): Reader<T> {
    function maybeSimplify(index: number, errors: ReadError[]): ReadError[] {
      if ((options.simplify ?? true)
          && errors.every(e => e.position === index)) {
        return [{
          position: index,
          expected: label,
          context: []
        }];
      } else {
        return errors;
      }
    }
    function modifyErrors(errors: ReadError[], index: number): ReadError[] {
      if (options.relabel ?? false) {
        return [{
          position: index,
          expected: label,
          context: []
        }];
      } else if (options.context ?? true) {
        return maybeSimplify(index, errors.map(error => ({
          position: error.position,
          expected: error.expected,
          context: [{position: index, label: label}].concat(error.context)
        })));
      } else {
        return maybeSimplify(index, errors);
      }
    }
    return this.mapResult((result, _, index) =>
      ReadResult.flatMap(
        result,
        token => ReadResult.token(token.value, {
          position: token.position,
          length: token.length,
          next: token.next,
          errors: modifyErrors(token.errors, index)
        }),
        failure => ReadResult.failure(...modifyErrors(failure.errors, index))),
      label);
  }
  failWhen(condition: (value: T, str: string, index: number) => boolean, label?: LabelArgument): Reader<T> {
    // const label = () => `${this.label} fails on condition`;
    const getLabel = () => {
      if (label == null) {
        return `${this.label} fails on condition`;;
      } else if (typeof label === 'string') {
        return label;
      } else {
        return label();
      }
    }
    return this.flatMap<T>((result, str, index) => {
      if (condition(result.value, str, index)) {
        return ReadResult.failure(ReadResult.error(getLabel(), index));
      }
      return result;
    }, getLabel);
  }
  lookahead<Ahead>(ahead: Reader<Ahead>): Reader<T> {
    return this.then(ahead)
      .flatMap(result => {
        const token = result.value[0];
        return ReadResult.token(token.value, {
          position: token.position,
          next: token.next,
          length: token.length,
          errors: result.errors
        });
      });
  }
  optional(): Reader<T | null> {
    return this.mapResult<T | null>((result, _, index) =>
      ReadResult.flatMap(
        result,
        token => token,
        failure => ReadResult.token(null, {
          position: index,
          next: index,
          length: 0,
          errors: failure.errors
        })),
      () => `[${this.label}]`);
  }
  ignoringSuccessFailures(): Reader<T> {
    return this.flatMap(result => ReadResult.token(result.value, {
      position: result.position,
      length: result.length,
      next: result.next
    }));
  }
}

// These imports must come at the end, otherwise, AbstractReader is undefined
// when the subclasses try to inherit from it.
import { LabelOptions } from "./readers/LabelOptions";
import { LabelArgument, ResultMapReader } from "./readers/ResultMapReader";
import { DelegatingReader } from "./readers/DelegatingReader";
import { SeqReader } from "./readers/SeqReader";
import { MapReadToken, MapReadType } from "./Types";
import { AnyReader } from "./readers/AnyReader";
import { RepeatReader } from "./readers/RepeatReader";

