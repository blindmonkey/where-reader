import { EitherReader } from "./readers/EitherReader";
import { FailReader } from "./readers/FailReader";
import { LabeledReader } from "./readers/LabeledReader";
import { TransformReader } from "./readers/MapReader";
import { MiddleReader } from "./readers/MiddleReader";
import { RepeatReader } from "./readers/RepeatReader";
import { SeparatedReader } from "./readers/SeparatedReader";
import { Tuple2Reader } from "./readers/Tuple2Reader";
import { WrappedReader } from "./readers/WrappedReader";
import { ReadToken } from "./ReadToken";

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