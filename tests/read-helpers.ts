import { ReadResult } from "../src/read/ReadResult";
import { Reader } from "../src/read/Reader";
import { ReadFailure } from "../src/read/ReadResult";

function deduplicate(arr: string[]): string[] {
  const sentinel = {};
  const seen: { [k: string]: {} } = {};
  const result: string[] = [];
  arr.forEach(item => {
    if (seen[item] !== sentinel) {
      result.push(item);
      seen[item] = sentinel;
    }
  });
  return result;
}
export function read<T>(reader: Reader<T>, string: string, withContext: boolean = true) {
  function processFailure(failure: ReadFailure) {
    const byPosition: { [position : number]: {
      position: number,
      expected: string[]
    } } = {};
    failure.errors.forEach(error => {
      if (!Object.prototype.hasOwnProperty.call(byPosition, error.position)) {
        byPosition[error.position] = {
          position: error.position,
          expected: []
        };
      }
      byPosition[error.position].expected
        .push(error.expected);
    });
    return {
      errors: Object.keys(byPosition).flatMap(key => {
        const value = byPosition[key as any as number];
        return {
          position: value.position,
          expected: deduplicate(value.expected).join(' | ')
        };
      })
    };
  }
  function processFailureWithContext(failure: ReadFailure) {
    function contextKey(context: {label: string, position: number}[]): string {
      return context.map(c => `${c.label}:${c.position}`).join(' > ');
    }
    const byPosition: { [position : number]: {
      position: number,
      byContext: { [context: string]: {
        context: {label: string, position: number}[],
        expected: string[]
      } }
    } } = {};
    failure.errors.forEach(error => {
      if (!Object.prototype.hasOwnProperty.call(byPosition, error.position)) {
        byPosition[error.position] = {
          position: error.position,
          byContext: {}
        };
      }
      const byContext = byPosition[error.position].byContext;
      const context = contextKey(error.context);
      if (!Object.prototype.hasOwnProperty.call(byContext, context)) {
        byContext[context] = {
          context: error.context,
          expected: []
        };
      }
      byContext[context].expected.push(error.expected);
    });
    return {
      errors: Object.keys(byPosition).flatMap(positionKey => {
        const position = byPosition[positionKey as any as number];
        return Object.keys(position.byContext).map(contextKey => ({
          position: position.position,
          context: contextKey,
          expected: position.byContext[contextKey].expected.join(' | ')
        }));
      })
    };
  }
  const result = reader.read(string, 0);
  if (ReadResult.isFailure(result)) {
    if (withContext) {
      return processFailureWithContext(result);
    } else {
      return processFailure(result);
    }
  }
  return result.value;
}
export function identifier(identifier: string, position: number, length: number) {
  return { type: 'identifier', identifier, position, length };
}
export function number(value: string, position: number = 0, length: number = 0) {
  return { type: 'number', value, position, length };
}
export function binary<Op extends string, LHS, RHS>(operator: Op, lhs: LHS, rhs: RHS) {
  return { type: 'binary', operator, lhs, rhs };
}
export function list(...tokens: any[]) {
  return { type: 'list', tokens };
}
export function property<A, B>(expr: A, identifier: B) {
  return { type: 'property', expr: expr, identifier: identifier };
}
export function subscript<A, B>(value: A, property: B) {
  return { type: 'subscript', value, property };
}
export function string(content: string, position: number, length: number) {
  return { type: 'string', content, position, length };
}