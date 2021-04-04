import { Reader } from "../Reader";
import { ReadResult } from "../ReadResult";
import { AnyReader } from "./AnyReader";
import { DelegatingReader } from "./DelegatingReader";
import { RepeatReader } from "./RepeatReader";
import { ResultMapReader } from "./ResultMapReader";
import { SeqReader } from "./SeqReader";

const anySymbol: unique symbol = Symbol('any');
const delegatingSymbol: unique symbol = Symbol('delegating');
const resultMapSymbol: unique symbol = Symbol('result-map');
const seqSymbol: unique symbol = Symbol('seq');
const repeatSymbol: unique symbol = Symbol('repeat');

export const Symbols = {
  any: anySymbol as typeof anySymbol,
  delegating: delegatingSymbol as typeof delegatingSymbol,
  resultMap: resultMapSymbol as typeof resultMapSymbol,
  seq: seqSymbol as typeof seqSymbol,
  repeat: repeatSymbol as typeof repeatSymbol
};
export type Symbols = typeof Symbols;

export type CompilationSymbol =
  Symbols['any']
  | Symbols['delegating']
  | Symbols['resultMap']
  | Symbols['seq']
  | Symbols['repeat'];

export const compilation = Symbol('compilation-type');

export interface Compilable<T extends keyof Symbols> {
  [compilation]: Symbols[T];
}

interface ReaderRepr<T extends CompilationSymbol> {
  type: T;
  id: number;
  label: string;
}
interface AnyReaderRepr extends ReaderRepr<Symbols['any']> {
  readers: SomeReaderRepr[];
}
interface SeqReaderRepr extends ReaderRepr<Symbols['seq']> {
  readers: SomeReaderRepr[];
}
interface DelegatingReaderRepr extends ReaderRepr<Symbols['delegating']> {
  delegate: {type: 'reader', reader: SomeReaderRepr}
    | {type: 'function', fn: (str: string, index: number) => ReadResult<any>};
}
interface RepeatReaderRepr extends ReaderRepr<Symbols['repeat']> {
  reader: SomeReaderRepr;
}
interface ResultMapReaderRepr extends ReaderRepr<Symbols['resultMap']> {
  reader: SomeReaderRepr;
  map: (value: ReadResult<any>, str: string, index: number) => ReadResult<any>;
}

type SomeReaderRepr =
  AnyReaderRepr
  | DelegatingReaderRepr
  | RepeatReaderRepr
  | ResultMapReaderRepr
  | SeqReaderRepr;

class ReprGenContext {
  private idsym = Symbol('id');
  private id = 0;
  readers: { [k in number]: SomeReaderRepr } = {};
  register(reader: Reader<any>, repr: SomeReaderRepr): number {
    if (this.idsym in reader) return (reader as any)[this.idsym];
    const rid = this.id++;
    (reader as any)[this.idsym] = rid;
    this.readers[rid] = repr;
    return rid;
  }
  get(reader: Reader<any>): null | SomeReaderRepr {
    if (this.idsym in reader)
      return this.readers[(reader as any)[this.idsym]];
    return null;
  }
}

function count(s: string, i: string): number {
  let index = 0;
  let count = 0;
  while (index >= 0) {
    index = s.indexOf(i, index);
    if (index >= 0) {
      count++;
      index += i.length;
    }
  }
  return count;
}

function genRepr<T>(reader: Reader<T>, context: ReprGenContext): SomeReaderRepr {
  if (!(compilation in reader)) throw 'Incompatible reader';
  const r = context.get(reader);
  if (r != null) return r;

  const type = (reader as any)[compilation] as CompilationSymbol;
  switch (type) {
    case Symbols.any:
      const arepr: AnyReaderRepr = {
        type: Symbols.any,
        label: reader.label,
        id: 0,
        readers: []
      };
      arepr.id = context.register(reader, arepr);
      arepr.readers = (reader as AnyReader<any>).readers
        .map((r: Reader<any>) => genRepr(r, context));
      return arepr;

    case Symbols.delegating:
      const dreader = reader as DelegatingReader<any>;
      const drepr: DelegatingReaderRepr = {
        type: Symbols.delegating,
        label: reader.label,
        id: 0,
        delegate: null!
      };
      drepr.id = context.register(reader, drepr);
      if (dreader.delegate.length === 1) {
        drepr.delegate = {
          type: 'reader',
          reader: genRepr(dreader.delegate[0], context)
        }
      } else {
        drepr.delegate = {
          type: 'function',
          fn: dreader.delegate[0]
        };
      }
      return drepr;

    case Symbols.repeat:
      const rreader = <RepeatReader<any>><unknown>reader;
      const rrepr: RepeatReaderRepr = {
        type: Symbols.repeat,
        label: reader.label,
        id: 0,
        reader: null!
      };
      rrepr.id = context.register(reader, rrepr);
      rrepr.reader = genRepr(rreader.reader, context);
      return rrepr;

    case Symbols.resultMap:
      const resreader = <ResultMapReader<any, any>>reader;
      const resrepr: ResultMapReaderRepr = {
        type: Symbols.resultMap,
        label: reader.label,
        id: 0,
        reader: null!,
        map: resreader.transform
      };
      resrepr.id = context.register(reader, resrepr);
      resrepr.reader = genRepr(resreader.reader, context);
      return resrepr;

    case Symbols.seq:
      const sreader = <SeqReader<any>>reader;
      const srepr: SeqReaderRepr = {
        type: Symbols.seq,
        label: reader.label,
        id: 0,
        readers: []
      };
      srepr.id = context.register(reader, srepr);
      srepr.readers = sreader.readers.map((r: Reader<any>) => genRepr(r, context));
      return srepr;
  }
}

function replaceAll(s: string, ss: string, sss: string): string {
  let index = 0;
  while (true) {
    const i = s.indexOf(ss, index);
    if (i < 0) return s;
    index = i + sss.length;
    s = s.replace(ss, sss);
  }
}
// NodeJS doesn't have a replaceAll implementation.
String.prototype.replaceAll = String.prototype.replaceAll || function(s: string, ss: string) {
  // @ts-ignore
  return replaceAll(this as any as string, s, ss);
};

const POSITION = 'p';
const RESULT = 'r';
const STR = 's';
const NL = '\n';

function compileRepr(repr: SomeReaderRepr, stack: number[], indent: number = 0): string {
  const ws = '  '.repeat(indent);
  const ws_1 = '  '.repeat(indent + 1);
  const ws___2 = '  '.repeat(indent + 2);
  const lbl = `${repr.label
    .replaceAll('\\', '\\\\')
    .replaceAll('\/', '\\/')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
    .replaceAll('\b', '\\b')
    .replaceAll('\f', '\\f')}\n`;
  const blabel = `${ws}// >>> ${lbl}`;
  const flabel = `${ws}// >>> ${lbl}`;
  switch (repr.type) {
    case Symbols.resultMap:
      return `${blabel}`
        + `${ws}let ${POSITION}${repr.reader.id} = ${POSITION}${repr.id};${NL}`
        + `${compileRepr(repr.reader, stack, indent + 1)}`
        + `${ws}let ${RESULT}${repr.id} = deps[${repr.id}](${RESULT}${repr.reader.id}, ${STR}, ${POSITION}${repr.id});${NL}`
        + flabel;
    case Symbols.delegating:
      switch (repr.delegate.type) {
        case 'function':
          return `${blabel}`
            + `${ws}let ${RESULT}${repr.id} = deps[${repr.id}](${STR}, ${POSITION}${repr.id});${NL}`
            + flabel;
        case 'reader':
          return blabel
          + `${ws}let ${RESULT}${repr.id} = del${repr.id}(${POSITION}${repr.id});${NL}`
          + flabel;
      }
    case Symbols.any:
      return blabel
        + `${ws}let errors${repr.id} = [];${NL}`
        + `${ws}let ${RESULT}${repr.id} = null;${NL}`
        + repr.readers.map(r => (
          `${ws}if (${RESULT}${repr.id} == null) {${NL}`
        + `${ws_1}let ${POSITION}${r.id} = ${POSITION}${repr.id};${NL}`
        + `${compileRepr(r, [], indent + 1)}`
        + `${ws_1}if (ReadResult.isFailure(${RESULT}${r.id})) {${NL}`
        + `${ws___2}errors${repr.id} = errors${repr.id}.concat(${RESULT}${r.id}.errors);${NL}`
        + `${ws_1}} else {${NL}`
        + `${ws___2}${RESULT}${repr.id} = ${RESULT}${r.id};${NL}`
        + `${ws_1}}${NL}`
        + `${ws}}${NL}`
        )).join('')
        + `${ws}if (${RESULT}${repr.id} == null) {${NL}`
        + `${ws_1}${RESULT}${repr.id} = ReadResult.failure(...errors${repr.id});${NL}`
        + `${ws}}${NL}`
        + flabel;

    case Symbols.seq:
      return blabel
          + `${ws}let tokens${repr.id} = [];${NL}`
          + `${ws}let errors${repr.id} = [];${NL}`
          + `${ws}let failure${repr.id} = false;${NL}`
          + `${ws}let next${repr.id} = ${POSITION}${repr.id};${NL}`
          + repr.readers.map(r => (
            `${ws}if (!failure${repr.id}) {${NL}`
          + `${ws_1}let ${POSITION}${r.id} = next${repr.id};${NL}`
          + `${compileRepr(r, [], indent + 1)}`
          + `${ws_1}errors${repr.id}.push(...${RESULT}${r.id}.errors);${NL}`
          + `${ws_1}if (ReadResult.isFailure(${RESULT}${r.id})) {${NL}`
          + `${ws___2}failure${repr.id} = true;${NL}`
          + `${ws_1}} else {${NL}`
          + `${ws___2}tokens${repr.id}.push(${RESULT}${r.id});${NL}`
          + `${ws___2}next${repr.id} = ${RESULT}${r.id}.next;${NL}`
          + `${ws_1}}${NL}`
          + `${ws}}${NL}`
          )).join('')
          + `${ws}let ${RESULT}${repr.id};${NL}`
          + `${ws}if (failure${repr.id}) {${NL}`
          + `${ws_1}${RESULT}${repr.id} = ReadResult.failure(...errors${repr.id});${NL}`
          + `${ws}} else {${NL}`
          + `${ws_1}${RESULT}${repr.id} = ReadResult.token(tokens${repr.id}, {${NL}`
          + `${ws___2}position: ${POSITION}${repr.id},${NL}`
          + `${ws___2}length: next${repr.id} - ${POSITION}${repr.id},${NL}`
          + `${ws___2}next: next${repr.id},${NL}`
          + `${ws___2}errors: errors${repr.id}${NL}`
          + `${ws_1}});${NL}`
          + `${ws}}${NL}`
          + flabel;

    case Symbols.repeat:
      return blabel
        + `${ws}let tokens${repr.id} = [];${NL}`
        + `${ws}let errors${repr.id} = [];${NL}`
        + `${ws}let next${repr.id} = ${POSITION}${repr.id};${NL}`
        + `${ws}while (true) {${NL}`
        + `${ws_1}let ${POSITION}${repr.reader.id} = next${repr.id};${NL}`
        + `${compileRepr(repr.reader, stack, indent + 2)}`
        + `${ws_1}if (ReadResult.isFailure(${RESULT}${repr.reader.id})) {${NL}`
        + `${ws___2}errors${repr.id} = ${RESULT}${repr.reader.id}.errors;${NL}`
        + `${ws___2}break;${NL}`
        + `${ws_1}} else {${NL}`
        + `${ws___2}tokens${repr.id}.push(${RESULT}${repr.reader.id});${NL}`
        + `${ws___2}next${repr.id} = ${RESULT}${repr.reader.id}.next;${NL}`
        + `${ws_1}}${NL}`
        + `${ws}}${NL}`
        + `${ws}let ${RESULT}${repr.id} = ReadResult.token(tokens${repr.id}, {${NL}`
        + `${ws_1}position: ${POSITION}${repr.id},${NL}`
        + `${ws_1}length: next${repr.id} - ${POSITION}${repr.id},${NL}`
        + `${ws_1}next: next${repr.id},${NL}`
        + `${ws_1}errors: errors${repr.id}${NL}`
        + `${ws}});${NL}`
        + flabel;
  }
}

export function compile<T>(reader: Reader<T>): (str: string, index: number) => ReadResult<T> {
  type Deps = { [k in number]: Function };
  const context = new ReprGenContext();
  const r = genRepr(reader, context);
  const deps: Deps = {};
  const delegates: string[] = [];
  for (const id in context.readers) {
    const reader = context.readers[id];
    switch (reader.type) {
      case Symbols.any: break;
      case Symbols.seq: break;
      case Symbols.repeat: break;
      case Symbols.delegating:
        if (reader.delegate.type === 'function') {
          deps[reader.id] = reader.delegate.fn;
        } else {
          const r = reader.delegate.reader;
          delegates.push(`    function del${id}(${POSITION}${r.id}) {\n`
            + `${compileRepr(r, [], 3)}`
            + `      return ${RESULT}${r.id};\n`
            + `    }\n`);
        }
        break;
      case Symbols.resultMap:
        deps[reader.id] = reader.map;
        break;
    }
  }
  const fncode = `(function(ReadResult, deps) {\n`
    + `  'use strict';\n`
    + `  return function(${STR}, ${POSITION}0) {\n'use strict'\n`
    + `${delegates.join('')}`
    + `${compileRepr(r, [], 2)}`
    + `    return ${RESULT}0;\n`
    + `  };\n`
    + `})\n`;
  console.info(`Compiling ${count(fncode, '\n')} lines`);
  const fn = eval(fncode).bind(null, ReadResult)(deps);
  return fn;
}