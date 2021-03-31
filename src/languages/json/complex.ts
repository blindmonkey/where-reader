import { Read } from "../../read/Read";
import { DelegatingReader } from "../../read/readers/DelegatingReader";
import { boolean, number, string } from "./primitives";

const jsonString: unique symbol = Symbol('string');
const jsonNumber: unique symbol = Symbol('number');
const jsonArray: unique symbol = Symbol('array');
const jsonObject: unique symbol = Symbol('object');
const jsonBoolean: unique symbol = Symbol('boolean');
const jsonNull: unique symbol = Symbol('null');

type JsonStringSymbol = typeof jsonString;
type JsonNumberSymbol = typeof jsonNumber;
type JsonArraySymbol = typeof jsonArray;
type JsonObjectSymbol = typeof jsonObject;
type JsonBooleanSymbol = typeof jsonBoolean;
type JsonNullSymbol = typeof jsonNull;

interface BaseJsonValue<T extends Symbol> {
  type: T;
}
export interface JsonString extends BaseJsonValue<JsonStringSymbol> {
  content: string;
}
export interface JsonNumber extends BaseJsonValue<JsonNumberSymbol> {
  content: string;
}
export interface JsonArray extends BaseJsonValue<JsonArraySymbol> {
  content: JsonValue[];
}
export interface JsonObject extends BaseJsonValue<JsonObjectSymbol> {
  content: { [k in string]: JsonValue };
}
export interface JsonBoolean extends BaseJsonValue<JsonBooleanSymbol> {
  content: boolean;
}
export interface JsonNull extends BaseJsonValue<JsonNullSymbol> {}
export type JsonValue = JsonString | JsonNumber | JsonArray | JsonObject | JsonBoolean | JsonNull;

export namespace Json {
  export function string(content: string): JsonString {
    return { type: jsonString, content };
  }
  export function number(content: string): JsonNumber {
    return { type: jsonNumber, content };
  }
  export function array(content: JsonValue[]): JsonArray {
    return { type: jsonArray, content };
  }
  export function object(content: { [k in string]: JsonValue }): JsonObject {
    return { type: jsonObject, content };
  }
  export function boolean(content: boolean): JsonBoolean {
    return { type: jsonBoolean, content };
  }
  export const nul: JsonNull = { type: jsonNull };
}

export function convertJsonValue(value: JsonValue): string | boolean | number | null | any[] | { [k in string]: any } {
  switch (value.type) {
    case jsonString:
      return value.content;
    case jsonBoolean:
      return value.content;
    case jsonNull:
      return null;
    case jsonArray:
      return value.content.map(convertJsonValue);
    case jsonNumber:
      return parseFloat(value.content);
    case jsonObject:
      const obj: { [k in string]: any } = {};
      for (let k in value.content) {
        obj[k] = convertJsonValue(value.content[k]);
      }
      return obj;
  }
}

const whitespace =
  Read.char(' ')
  .or(Read.char('\t'))
  .or(Read.char('\n'))
  .or(Read.char('\r'))
  .or(Read.char('\ufeff')) // BOM should be skipped in the middle of the string
  .repeated()
  .ignoringSuccessFailures();

const valueDelegate = new DelegatingReader<JsonValue>();
export const value = valueDelegate
  .labeled('JSON value')
  .wrappedBy(whitespace);

const array = value.separatedBy(Read.char(','))
  .between(Read.char('['), Read.char(']'))
  .map(tokens => tokens.map(t => t.value))
  .labeled('JSON array');
const object =
  Read.seq(string, Read.char(':').wrappedBy(whitespace), value)
    .map<[string, JsonValue]>(tokens => [tokens[0].value, tokens[2].value])
  .wrappedBy(whitespace)
  .separatedBy(Read.char(','))
  .map(tokens => tokens.map(t => t.value))
  .between(Read.char('{'), Read.char('}'))
  .labeled('JSON object');

valueDelegate.setDelegate(
  string.map(Json.string)
  .or(array.map(Json.array))
  .or(object.map(keyValues => {
    const obj: { [k in string]: JsonValue } = {};
    keyValues.forEach(v => (obj[v[0]] = v[1]));
    return obj;
  }).map(Json.object))
  .or(boolean.map(Json.boolean))
  .or(Read.literal('null').map(() => Json.nul))
  .or(number.map(Json.number)))
