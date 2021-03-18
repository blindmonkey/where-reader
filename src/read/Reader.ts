import { EitherReader } from "./readers/EitherReader";
import { FailReader } from "./readers/FailReader";
import { IgnoreFailuresReader } from "./readers/IgnoreFailuresReader";
import { LabeledReader, LabelOptions } from "./readers/LabeledReader";
import { LookaheadReader } from "./readers/LookaheadReader";
import { MapReader } from "./readers/MapReader";
import { MiddleReader } from "./readers/MiddleReader";
import { OptionalReader } from "./readers/OptionalReader";
import { RepeatReader } from "./readers/RepeatReader";
import { SeparatedReader } from "./readers/SeparatedReader";
import { Tuple2Reader } from "./readers/Tuple2Reader";
import { WrappedReader } from "./readers/WrappedReader";
import { ReadResult } from "./ReadResult";

export interface Reader<T> {
  label: string;
  read(str: string, index: number): ReadResult<T>;
  or<Other>(other: Reader<Other>): EitherReader<T, Other>;
  map<Output>(f: (input: T) => Output): MapReader<T, Output>;
  then<Next>(next: Reader<Next>): Tuple2Reader<T, Next>;
  repeated(): RepeatReader<T>;
  separatedBy<Sep>(sep: Reader<Sep>): SeparatedReader<T, Sep>;
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): MiddleReader<Left, T, Right>;
  wrappedBy<Wrapper>(wrapper: Reader<Wrapper>): WrappedReader<T, Wrapper>;
  labeled(label: string, options?: LabelOptions): LabeledReader<T>;
  failWhen(condition: (value: T) => boolean): FailReader<T>;
  lookahead<Ahead>(ahead: Reader<Ahead>): LookaheadReader<T, Ahead>;
  optional(): OptionalReader<T>;
  ignoringSuccessFailures(): IgnoreFailuresReader<T>;
}