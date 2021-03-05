import { EitherReader } from "./EitherReader";
import { FailReader } from "./FailReader";
import { LabeledReader } from "./LabeledReader";
import { TransformReader } from "./MapReader";
import { MiddleReader } from "./MiddleReader";
import { ReadToken } from "./ReadToken";
import { RepeatReader } from "./RepeatReader";
import { SeparatedReader } from "./SeparatedReader";
import { Tuple2Reader } from "./Tuple2Reader";
import { WrappedReader } from "./WrappedReader";

export interface Reader<T> {
  read(str: string, index: number): ReadToken<T>|null;
  or<Other>(other: Reader<Other>): EitherReader<T, Other>;
  map<Output>(f: (input: T) => Output): TransformReader<T, Output>;
  then<Next>(next: Reader<Next>): Tuple2Reader<T, Next>;
  repeated(): RepeatReader<T>;
  separatedBy<Sep>(sep: Reader<Sep>): SeparatedReader<T, Sep>;
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): MiddleReader<Left, T, Right>;
  wrappedBy<Wrapper>(wrapper: Reader<Wrapper>): WrappedReader<T, Wrapper>;
  labeled(label: string): LabeledReader<T>;
  failWhen(condition: (value: T) => boolean): FailReader<T>;
}