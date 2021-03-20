import { Reader } from "./Reader";
import { ReadError, ReadFailure, ReadResult, ReadToken } from "./ReadResult";

export abstract class AbstractReader<T> implements Reader<T> {
  abstract label: string;
  abstract read(str: string, index: number): ReadResult<T>;
  or<Other>(other: Reader<Other>): Reader<T | Other> {
    // return new EitherReader(this, other);
    return this.mapResult<T | Other>((leftValue, str, index) => {
      if (leftValue.type !== 'failure') return leftValue;

      const rightValue = other.read(str, index);
      // And argument could be made here for propagating the errors from
      // `leftValue`. However, It's currently unclear whether there are instances
      // where these errors would be useful.
      if (rightValue.type !== 'failure') return rightValue;

      return <ReadFailure>{
        type: 'failure',
        errors: leftValue.errors.concat(rightValue.errors)
      };
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
      if (result.type === 'failure') return result;
      return f(result, str, position);
    }, label);
  }
  mapToken<Output>(f: (token: ReadToken<T>) => Output, label?: LabelArgument): Reader<Output> {
    return this.flatMap(token => ({
      type: 'token',
      value: f(token),
      position: token.position,
      length: token.length,
      next: token.next,
      errors: token.errors
    }), label);
  }
  then<Next>(next: Reader<Next>): Tuple2Reader<T, Next> {
    return new Tuple2Reader(this, next);
  }
  repeated(): RepeatReader<T> {
    return new RepeatReader(this);
  }
  separatedBy<Sep>(sep: Reader<Sep>): SeparatedReader<T, Sep> {
    return new SeparatedReader(this, sep);
  }
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): MiddleReader<Left, T, Right> {
    return new MiddleReader(left, this, right);
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
      if (result.type === 'failure') {
        return <ReadFailure>{
          type: 'failure',
          errors: modifyErrors(result.errors, index)
        };
      }
      return {
        type: 'token',
        value: result.value,
        position: result.position,
        length: result.length,
        next: result.next,
        errors: modifyErrors(result.errors, index)
      };
    }, label);
  }
  failWhen(condition: (value: T) => boolean): FailReader<T> {
    return new FailReader(this, condition);
  }
  lookahead<Ahead>(ahead: Reader<Ahead>): LookaheadReader<T, Ahead> {
    return new LookaheadReader(this, ahead);
  }
  optional(): OptionalReader<T> {
    return new OptionalReader(this);
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
import { FailReader } from "./readers/FailReader";
import { LabelOptions } from "./readers/LabelOptions";
import { MiddleReader } from "./readers/MiddleReader";
import { RepeatReader } from "./readers/RepeatReader";
import { SeparatedReader } from "./readers/SeparatedReader";
import { Tuple2Reader } from "./readers/Tuple2Reader";
import { WrappedReader } from "./readers/WrappedReader";
import { LookaheadReader } from "./readers/LookaheadReader";
import { OptionalReader } from "./readers/OptionalReader";
import { LabelArgument, ResultMapReader } from "./readers/ResultMapReader";

