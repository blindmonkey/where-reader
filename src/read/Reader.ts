import { FailReader } from "./readers/FailReader";
import { LabelOptions } from "./readers/LabelOptions";
import { LookaheadReader } from "./readers/LookaheadReader";
import { MiddleReader } from "./readers/MiddleReader";
import { OptionalReader } from "./readers/OptionalReader";
import { RepeatReader } from "./readers/RepeatReader";
import { LabelArgument } from "./readers/ResultMapReader";
import { SeparatedReader } from "./readers/SeparatedReader";
import { Tuple2Reader } from "./readers/Tuple2Reader";
import { WrappedReader } from "./readers/WrappedReader";
import { ReadResult, ReadToken } from "./ReadResult";

export interface Reader<T> {
  /**
   * The label of this `Reader`, which details what this reader will match in a
   * human-readable form.
   */
  label: string;

  /**
   * The main actor of the `Reader` interface. Attempts to read from the given
   * string, starting at the given position.
   */
  read(str: string, index: number): ReadResult<T>;

  /**
   * Attempt to read from `other` when `this` reader fails.
   * @param other The reader to try if `this` one fails.
   */
  or<Other>(other: Reader<Other>): Reader<T | Other>;

  /**
   * Transform the output of `this` `Reader`.
   * @param f Transform `T` into `Output`.
   */
  map<Output>(f: (input: T) => Output, label?: LabelArgument): Reader<Output>;

  mapResult<Output>(f: (result: ReadResult<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output>;

  /**
   * Transforms the token returned by `this` `Reader` to a result.
   * @param f The transform function.
   */
  flatMap<Output>(f: (token: ReadToken<T>, str: string, position: number) => ReadResult<Output>, label?: LabelArgument): Reader<Output>;

  /**
   * Transforms the token returned by `this` `Reader` to a different type.
   * @param f The transform function.
   */
  mapToken<Output>(f: (token: ReadToken<T>) => Output, label?: LabelArgument): Reader<Output>;

  /**
   * First read `this`, then read `Next`.
   * @param next The reader to attempt next when this one succeeds.
   */
  then<Next>(next: Reader<Next>): Reader<[ReadToken<T>, ReadToken<Next>]>;

  /**
   * Repeatedly read `T` via `this` `Reader` until failure.
   */
  repeated(): RepeatReader<T>;

  /**
   * Repeatedly read `T` via `this` `Reader`, separated by `sep`.
   * @param sep The reader for the separator.
   */
  separatedBy<Sep>(sep: Reader<Sep>): SeparatedReader<T, Sep>;

  /**
   * Read this reader, surrounded by `left` and `right`, respectively.
   * @param left The `Reader` to read first.
   * @param right The `Reader` to read last.
   */
  between<Left, Right>(left: Reader<Left>, right: Reader<Right>): MiddleReader<Left, T, Right>;

  /**
   * Like `between`, but the before and after `Reader`s are assumed to be the
   * same.
   * @param wrapper The `Reader` that `this` should be surrounded by.
   */
  wrappedBy<Wrapper>(wrapper: Reader<Wrapper>): WrappedReader<T, Wrapper>;

  /**
   * Apply a label to the result of `this` `Reader`, either by adding to the
   * context of the errors, or by coalescing all errors under a single label.
   * @param label The label to apply.
   * @param options The options detailing how to apply the label.
   */
  labeled(label: string, options?: LabelOptions): Reader<T>;

  /**
   * Read via `this` `Reader`, but fail when a condition succeeds.
   * @param condition The condition under which the read should fail.
   */
  failWhen(condition: (value: T) => boolean): FailReader<T>;

  /**
   * Read via `this` `Reader`, and ensure that `ahead` follows.
   * @param ahead The `Reader` that reads what comes after `this`.
   */
  lookahead<Ahead>(ahead: Reader<Ahead>): LookaheadReader<T, Ahead>;

  /**
   * Read via `this` `Reader`, or simply return an empty read if it fails.
   */
  optional(): OptionalReader<T>;

  /**
   * Don't propagate errors that occur on success.
   */
  ignoringSuccessFailures(): Reader<T>;
}