import { Reader } from "./Reader";
import { ReadToken } from "./ReadToken";


export abstract class AbstractReader<T> implements Reader<T> {
  abstract read(str: string, index: number): ReadToken<T>|null;
  or<Other>(other: Reader<Other>): EitherReader<T, Other> {
    return new EitherReader(this, other);
  }
  map<Output>(f: (input: T) => Output): TransformReader<T, Output> {
    return new TransformReader(this, f);
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
  labeled(label: string): LabeledReader<T> {
    return new LabeledReader(this, label);
  }
  failWhen(condition: (value: T) => boolean): FailReader<T> {
    return new FailReader(this, condition);
  }
}

// These imports must come at the end, otherwise, AbstractReader is undefined
// when the subclasses try to inherit from it.
import { EitherReader } from "./readers/EitherReader";
import { FailReader } from "./readers/FailReader";
import { LabeledReader } from "./readers/LabeledReader";
import { TransformReader } from "./readers/MapReader";
import { MiddleReader } from "./readers/MiddleReader";
import { RepeatReader } from "./readers/RepeatReader";
import { SeparatedReader } from "./readers/SeparatedReader";
import { Tuple2Reader } from "./readers/Tuple2Reader";
import { WrappedReader } from "./readers/WrappedReader";
